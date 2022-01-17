const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Validate that the order exists through the ID param
const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    } 
    else next({ status: 404, message: `Order id not found: ${orderId}` });
}

// Validate that any required props exist.
const validProp = (prop) => {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[prop]) return next();
        else next({ status: 400, message: `Order must include a ${prop}` });
    }
}

// Validate that dishes exists and has a valid quantity.
const validateDishes = (req, res, next) => {
    const { data: { dishes } = {} } = req.body;
    let failedMsg = "";
    if (!dishes) failedMsg = "Order must include a dish.";
    else if (!Array.isArray(dishes) || dishes.length === 0) failedMsg = "Order must include one dish";
    else {
        dishes.forEach(dish => {
            const quantity = dish.quantity;
            if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
                failedMsg = `Dish ${dish.id} must have a quantity greater than 0.`;
            }
        }) 
    }

    if (failedMsg) next({ status: 400, message: failedMsg });
    else next();
}

// Validate that the status exists and can be changed.
const validateStatus = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { id, status } = {} } = req.body;
    let failedMsg = "";
    if (id && id !== orderId) failedMsg = `Order id doesn't match route id. Order ${id}, Route: ${orderId}`;
    else if (!status || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) failedMsg = "Order must have a status of pending, preparing, out-for-delivery, or delivered";
    else if (status === "delivered") failedMsg = "A delivered order cannot be changed";

    if (failedMsg) next({ status: 400, message: failedMsg });
    else next();
}

// Respond with the requested orders
const list = (req, res, next) => {
    const { orderId } = req.params;
    res.json({ data: orders.filter(orderId ? use => use.id == orderId : () => true)})
}

// Respond with the requested order
const read = (req, res, next) => {
    res.json({ data: res.locals.order })
}

// Create a new order
const create = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

// Update an existing order
const update = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    res.locals.order = {
        id: res.locals.order.id,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    }

    res.json({ data: res.locals.order });
}

// Delete an existing order
const destroy = (req, res, next) => {
    const { orderId } = req.params;
    const order = orders.find((order) => order.id == orderId);
    if (order.status !== "pending") next({ status: 400, message: `Cannot delete order ${orderId}, as it is no longer pending.`});
    else {
        orders.splice(order, 1);
        res.sendStatus(204);
    }
}


module.exports = {
    list,
    read: [orderExists, read],
    delete: [orderExists, destroy],
    create: [
        validProp("deliverTo"),
        validProp("mobileNumber"),
        validateDishes,
        create
    ],
    update: [
        orderExists,
        validProp("deliverTo"),
        validProp("mobileNumber"),
        validateDishes,
        validateStatus,
        update
    ]
}