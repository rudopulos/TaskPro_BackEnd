const HttpError = require("../helpers/HttpError");
const controllerWrapper = require("../helpers/decorators");
const Dashboard = require("../models/dashboard");
const Column = require("../models/column");
const Card = require("../models/card");

async function getAll(req, res) {
  const { _id: owner } = req.user;
  const result = await Dashboard.find({ owner }, "-createdAt -updatedAt");
  res.json(result);
}

async function getById(req, res) {
  const { dashboardId } = req.params;
  const { _id: owner } = req.user;
  const dashboard = await Dashboard.findOne({ _id: dashboardId, owner });
  if (!dashboard) {
    throw HttpError(404, "Dashboard not found or access denied");
  }

  const columns = await Column.find({ owner: dashboard._id });
  if (columns.length > 0) {
    const columnsWithOwnCards = await Column.aggregate([
      {
        $match: { $or: columns.map((column) => ({ _id: column._id })) },
      },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "owner",
          as: "cards",
        },
      },
    ]);

    return res.json({
      dashboard,
      columns: columnsWithOwnCards,
    });
  }

  // This will now only execute if columns.length is 0
  res.json({
    dashboard,
    columns: [],
  });
}

async function addNew(req, res) {
  const { _id: owner } = req.user;
  const result = await Dashboard.create({ ...req.body, owner });
  res.status(201).json(result);
}

async function removeById(req, res) {
  const { dashboardId } = req.params;
  const { _id: owner } = req.user;
  const deletedBoard = await Dashboard.findOneAndRemove({ _id: dashboardId, owner });
  if (!deletedBoard) throw HttpError(404, "Dashboard not found or access denied");

  const columns = await Column.find({ owner: dashboardId });
  await Column.deleteMany({ owner: dashboardId });
  const ArrayColumnsIds = columns.map((column) => column._id);
  await Card.deleteMany({ owner: { $in: ArrayColumnsIds } });

  res.json({
    message: "Dashboard and all related content deleted successfully",
    deletedBoardId: dashboardId
  });
}

async function updateById(req, res) {
  const { dashboardId } = req.params;
  const { _id: owner } = req.user;
  const result = await Dashboard.findOneAndUpdate(
    { _id: dashboardId, owner },
    req.body,
    { new: true }
  );
  if (!result) throw HttpError(404, "Dashboard not found or access denied");
  res.json(result);
}

async function updateCurrentDashboard(req, res) {
  const { dashboardId } = req.params;
  const result = await Dashboard.findByIdAndUpdate(
    dashboardId,
    { ...req.body },
    { new: true }
  );
  if (!result) throw HttpError(404);
  res.json(result);
}

module.exports = {
  getAll: controllerWrapper(getAll),
  getById: controllerWrapper(getById),
  addNew: controllerWrapper(addNew),
  removeById: controllerWrapper(removeById),
  updateById: controllerWrapper(updateById),
  updateCurrentDashboard: controllerWrapper(updateCurrentDashboard),
};
