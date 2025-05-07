const Joi = require('joi');

/**
 * Creates a validation middleware using Joi schema
 * @param {Object} schema - Joi schema object
 * @returns {Function} Express middleware function
 */
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return res.status(500).json({ error: 'Validation schema not found' });
        }

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

// Validation schemas
const schemas = {
    register: Joi.object({
        firstName: Joi.string().required().min(2).max(50),
        lastName: Joi.string().required().min(2).max(50),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(6).max(50)
    }),

    login: Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    }),

    updateProfile: Joi.object({
        firstName: Joi.string().min(2).max(50),
        lastName: Joi.string().min(2).max(50),
        email: Joi.string().email(),
        password: Joi.string().min(6).max(50)
    }).min(1), // At least one field must be provided

    resetPassword: Joi.object({
        email: Joi.string().required().email()
    }),

    newPassword: Joi.object({
        password: Joi.string().required().min(6).max(50),
        confirmPassword: Joi.string().required().valid(Joi.ref('password'))
    }),

    product: Joi.object({
        name: Joi.string().required().min(2).max(100),
        description: Joi.string().required().min(10).max(1000),
        price: Joi.number().required().min(0),
        category: Joi.string().required(),
        stock: Joi.number().integer().min(0).required(),
        imageUrl: Joi.string().uri().allow('')
    }),

    cartItem: Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required()
    }),

    cartItemUpdate: Joi.object({
        quantity: Joi.number().integer().min(1).required()
    }),

    checkout: Joi.object({
        shippingAddress: Joi.object({
            firstName: Joi.string().required().min(2).max(50),
            lastName: Joi.string().required().min(2).max(50),
            email: Joi.string().required().email(),
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            zip: Joi.string().required(),
            country: Joi.string().required()
        }).required(),
        paymentMethod: Joi.object({
            type: Joi.string().valid('credit_card', 'paypal').required(),
            cardName: Joi.string().when('type', {
                is: 'credit_card',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('')
            }),
            cardNumber: Joi.string().when('type', {
                is: 'credit_card',
                then: Joi.string()
                    .required()
                    .pattern(/^\d[\d\s]*\d$/)  // Allow digits and spaces
                    .custom((value, helpers) => {
                        // Remove spaces and check if it's exactly 16 digits
                        const digitsOnly = value.replace(/\s/g, '');
                        if (!/^\d{16}$/.test(digitsOnly)) {
                            return helpers.error('string.cardNumber');
                        }
                        return value;
                    })
                    .messages({
                        'string.cardNumber': 'Card number must be exactly 16 digits'
                    }),
                otherwise: Joi.string().allow('')
            }),
            expiryDate: Joi.string().when('type', {
                is: 'credit_card',
                then: Joi.string().required().pattern(/^(0[1-9]|1[0-2])\/\d{2}$/),
                otherwise: Joi.string().allow('')
            }),
            cvv: Joi.string().when('type', {
                is: 'credit_card',
                then: Joi.string().required().pattern(/^\d{3,4}$/),
                otherwise: Joi.string().allow('')
            })
        }).required()
    }),

    addToCart: Joi.object({
        productId: Joi.string().required().max(15),
        quantity: Joi.number().integer().min(1).required()
    }),

    updateCartItem: Joi.object({
        quantity: Joi.number().integer().min(0).required()
    })
};

/**
 * Validates checkout form data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateCheckout = (req, res, next) => {
    const { error } = schemas.checkout.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

module.exports = {
    validate,
    schemas,
    validateCheckout
}; 