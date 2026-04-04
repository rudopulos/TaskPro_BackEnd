const HttpError = require("../helpers/HttpError");
const controllerWrapper = require("../helpers/decorators");
const Card = require("../models/card");
const Column = require("../models/column");
const Dashboard = require("../models/dashboard");

async function getById(req, res) {
  const { cardId } = req.params;
  const { _id: userId } = req.user;

  const card = await Card.findById(cardId).populate({
    path: "owner",
    populate: { path: "owner" },
  });

  if (!card || !card.owner?.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Card not found or access denied");
  }

  res.json(card);
}

async function addNew(req, res) {
  const { columnId } = req.params;
  const { _id: userId } = req.user;

  // Verify column and dashboard ownership
  const column = await Column.findById(columnId).populate("owner");
  if (!column || !column.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Column not found or access denied");
  }

  const result = await Card.create({
    ...req.body,
    owner: columnId,
  });
  res.status(201).json(result);
}

async function removeById(req, res) {
  const { cardId } = req.params;
  const { _id: userId } = req.user;

  const card = await Card.findById(cardId).populate({
    path: "owner",
    populate: { path: "owner" },
  });

  if (!card || !card.owner?.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Card not found or access denied");
  }

  const result = await Card.findByIdAndRemove(cardId);
  res.json(result);
}

async function updateById(req, res) {
  const { cardId } = req.params;
  const { _id: userId } = req.user;

  const card = await Card.findById(cardId).populate({
    path: "owner",
    populate: { path: "owner" },
  });

  if (!card || !card.owner?.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Card not found or access denied");
  }

  const result = await Card.findByIdAndUpdate(cardId, req.body, {
    new: true,
  });
  res.json(result);
}

async function setNewCardOwner(req, res) {
  const { cardId, columnId: destinationColumnId } = req.params;
  const { _id: userId } = req.user;
  const {
    sourceIndex,
    destinationIndex,
    sourceDroppableId: sourceColumnId,
  } = req.body;

  const card = await Card.findById(cardId).populate({
    path: "owner",
    populate: { path: "owner" },
  });

  if (!card || !card.owner?.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Card not found or access denied");
  }

  // Verify destination column ownership
  const destinationColumn = await Column.findById(destinationColumnId).populate("owner");
  if (!destinationColumn || !destinationColumn.owner?.owner?.equals(userId)) {
    throw HttpError(404, "Destination column not found or access denied");
  }

  const sourceColumn = await Column.findById(sourceColumnId);
  if (!sourceColumn) throw HttpError(404, "Source column not found");

  if (sourceColumnId === destinationColumnId) {
    // Reordering within same column
    const updatedCards = Array.from(sourceColumn.cards || []);
    const [movedCardId] = updatedCards.splice(sourceIndex, 1);
    updatedCards.splice(destinationIndex, 0, movedCardId);
    sourceColumn.cards = updatedCards;
    await sourceColumn.save();
  } else {
    // Moving between columns
    // Remove from source
    sourceColumn.cards = (sourceColumn.cards || []).filter(id => id.toString() !== cardId);
    await sourceColumn.save();

    // Add to destination
    destinationColumn.cards = destinationColumn.cards || [];
    destinationColumn.cards.splice(destinationIndex, 0, cardId);
    await destinationColumn.save();

    card.owner = destinationColumnId;
    await card.save();
  }

  res.json(card);
}
module.exports = {
  getById: controllerWrapper(getById),
  addNew: controllerWrapper(addNew),
  removeById: controllerWrapper(removeById),
  updateById: controllerWrapper(updateById),
  setNewCardOwner: controllerWrapper(setNewCardOwner),
};
