const HttpError = require("../helpers/HttpError");
const controllerWrapper = require("../helpers/decorators");
const Card = require("../models/card");
const Column = require("../models/column");
const Dashboard = require("../models/dashboard");

async function getById(req, res) {
  const { columnId } = req.params;
  const { _id: userId } = req.user;

  const column = await Column.findById(columnId).populate("owner");
  if (!column || !column.owner.owner.equals(userId)) {
    throw HttpError(404, "Column not found or access denied");
  }

  const cards = await Card.find({ owner: column._id });
  res.json({
    column,
    cards,
  });
}

async function addNew(req, res) {
  const { dashboardId } = req.params;
  const { _id: userId } = req.user;

  // Verify dashboard ownership
  const dashboard = await Dashboard.findOne({ _id: dashboardId, owner: userId });
  if (!dashboard) {
    throw HttpError(404, "Dashboard not found or access denied");
  }

  const result = await Column.create({
    ...req.body,
    owner: dashboardId,
  });
  res.status(201).json(result);
}

async function removeById(req, res) {
  const { columnId } = req.params;
  const { _id: userId } = req.user;

  const column = await Column.findById(columnId).populate("owner");
  if (!column || !column.owner.owner.equals(userId)) {
    throw HttpError(404, "Column not found or access denied");
  }

  await Column.findByIdAndRemove(columnId);
  await Card.deleteMany({ owner: columnId });

  res.json({
    message: "Column and its cards deleted successfully",
    deletedColumnId: columnId,
  });
}

async function updateById(req, res) {
  const { columnId } = req.params;
  const { _id: userId } = req.user;

  const column = await Column.findById(columnId).populate("owner");
  if (!column || !column.owner.owner.equals(userId)) {
    throw HttpError(404, "Column not found or access denied");
  }

  const result = await Column.findByIdAndUpdate(columnId, req.body, {
    new: true,
  });
  res.json(result);
}

module.exports = {
  getById: controllerWrapper(getById),
  addNew: controllerWrapper(addNew),
  removeById: controllerWrapper(removeById),
  updateById: controllerWrapper(updateById),
};
