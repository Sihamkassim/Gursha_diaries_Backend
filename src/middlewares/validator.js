const joi = require("joi");

// ✅ Signup Schema
exports.signupSchema = joi.object({
  email: joi
    .string()
    .min(5)
    .max(50)
    .email({ tlds: { allow: ["com", "net", "org"] } }) 
    .required(),
  password: joi.string().required().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
});

// ✅ Signin Schema
exports.signinSchema = joi.object({
  email: joi
    .string()
    .min(5)
    .max(50)
    .email({ tlds: { allow: ["com", "net", "org"] } }) 
    .required(),
  password: joi.string().required().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
});

// ✅ Accept Code Schema
exports.acceptCodeSchema = joi.object({
  email: joi
    .string()
    .min(5)
    .max(50)
    .email({ tlds: { allow: ["com", "net", "org"] } }) 
    .required(),
  providedCode: joi.number().required(),
});

// ✅ Change Password Schema
exports.changePasswordSchema = joi.object({
  newPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
  oldPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
});

exports.acceptFPCodeSchema = joi.object({
  email: joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ['com', 'net'] },
    }),
  providedCode: joi.number().required(),
  newPassword: joi.string()
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*d).{8,}$')),
});
const ingredientSchema = joi.object({
  name: joi.string().required(),
  quantity: joi.string().required(),
});

const commentSchema = joi.object({
  user: joi.string().required(),
  comment: joi.string().required(),
});

const moreSchema = joi.object({
  prep_time: joi.string().required(),
  cook_time: joi.string().required(),
  services: joi.string().required(),
  Difficulty: joi.string().required(),
  source: joi.string().required(),
});

exports.createItemSchema = joi.object({
  menuId: joi.number().required(),
  name: joi.string().required(),
  thumbnail_image: joi.string().required(),
  category: joi.string().required(),
  instructions: joi.string().required(),
  tags: joi.array().items(joi.string()).optional(),
  ingredients: joi.array().items(ingredientSchema).min(1).required(),
  comments: joi.array().items(commentSchema).optional(),
  more: joi.array().items(moreSchema).min(1).required(),
  userId: joi.string().required(),
});
