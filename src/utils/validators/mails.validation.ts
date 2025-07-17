import Joi from "joi"

export const contactFormValidation = (data: any) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        message: Joi.string().min(10).required()
    })
    return schema.validate(data, { abortEarly: false });
}