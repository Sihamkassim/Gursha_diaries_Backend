const {
  signupSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require("../middlewares/validator");

const User = require("../model/usersModel");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const jwt = require("jsonwebtoken");
const transport = require("../middlewares/sendMail");

// ✅ SIGNUP — now includes fullName & username
exports.signup = async (req, res) => {
  const { email, password, fullName, username } = req.body;

  try {
    // Validate email & password only — optional: extend schema to validate fullName & username
    const { error } = signupSchema.validate({ email, password });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res
        .status(409)
        .json({ success: false, message: "Email or username already exists" });
    // Hash password
    const hashedPassword = await doHash(password, 12);

    // Create user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      username,
    });
    const result = await newUser.save();

    // Don’t send password
    result.password = undefined;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result._id,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error during signup" });
  }
};
exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Simplified validation for signin
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return res.status(403).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        message: "User signed in successfully",
        userId: existingUser._id,
        token,
        fullName: existingUser.fullName,
        username: existingUser.username,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during signin" });
  }
};


// ✅ SIGNOUT (unchanged)
exports.signout = (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "User signed out successfully",
  });
};

// ✅ SEND VERIFICATION CODE
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });

    if (existingUser.verified)
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification Code",
      html: `<h1>Your verification code is ${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Verification code sent successfully",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send verification code",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ VERIFY VERIFICATION CODE
exports.verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error } = acceptCodeSchema.validate({ email, providedCode });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });

    if (existingUser.verified)
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    )
      return res
        .status(400)
        .json({ success: false, message: "Code is missing or invalid" });

    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000)
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired" });

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Your account has been verified",
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid verification code" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    if (!verified)
      return res
        .status(401)
        .json({ success: false, message: "You are not verified" });

    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });

    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result)
      return res
        .status(403)
        .json({ success: false, message: "Invalid password credentials" });

    existingUser.password = await doHash(newPassword, 12);
    await existingUser.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot password code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (error) {
    console.log(error);
  }
};

exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "something is wrong with the code!" });
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res
        .status(400)
        .json({ success: false, message: "code has been expired!" });
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Password updated!!" });
    }
    return res
      .status(400)
      .json({ success: false, message: "unexpected occured!!" });
  } catch (error) {
    console.log(error);
  }
};
