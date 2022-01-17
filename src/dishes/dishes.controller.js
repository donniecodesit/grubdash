const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    } else {
        next({
            status: 404,
            message: `Dish id not found: ${dishId}`
        })
    }
}

const validProp = (prop) => {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[prop]) return next();
        else next({status:400, message: `Must include a ${prop}`});
    }
}

// TODO: Implement the /dishes handlers needed to make the tests pass
const list = (req, res, next) => {
    const { dishId } = req.body;
    res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true)})
}

const read = (req, res, next) => {
    res.json({ data: res.locals.dish });
}

const create = (req, res, next) => {
    res.send("not added");
}

const update = (req, res, next) => {
    res.send("not added");
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [dishExists, create],
    update: [dishExists, update],
    dishExists
}