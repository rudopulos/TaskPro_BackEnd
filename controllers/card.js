const HttpError = require("../helpers/HttpError");
const controllerWrapper = require("../helpers/decorators");
const Card = require("../models/card");
const Column = require("../models/column");

async function getById(req, res) {
  const { cardId } = req.params;
  const result = await Card.findById(cardId);
  if (!result) throw HttpError(404);
  res.json(result);
}

async function addNew(req, res) {
  const { columnId } = req.params;
  const result = await Card.create({
    ...req.body,
    owner: columnId,
  });
  res.status(201).json(result);
}

async function removeById(req, res) {
  const { cardId } = req.params;
  const result = await Card.findByIdAndRemove(cardId);
  if (!result) throw HttpError(404);
  res.json(result);
}

async function updateById(req, res) {
  const { cardId } = req.params;
  const result = await Card.findByIdAndUpdate(cardId, req.body, {
    new: true,
  });
  if (!result) throw HttpError(404);
  res.json(result);
}

async function setNewCardOwner(req, res) {
  try {
    const { cardId, columnId } = req.params;
    const {
      destinationIndex,
      sourceIndex,
      sourceDroppableId,
      destinationDroppableId,
    } = req.body;

    const card = await Card.findById(cardId);
    if (!card) throw HttpError(404, "Card not found");

    const sourceColumnId = sourceDroppableId;
    const destinationColumnId = columnId;

    const sourceColumn = await Column.findById(sourceColumnId);

    if (!sourceColumn) {
      console.error(`Source column not found: ${sourceColumnId}`);
      throw HttpError(404, "Source column not found");
    }

    if (sourceColumnId === destinationColumnId) {
      // Reordering within the same column
      const updatedCards = Array.from(sourceColumn.cards || []);
      const [movedCard] = updatedCards.splice(sourceIndex, 1);
      updatedCards.splice(destinationIndex, 0, movedCard);

      // Update the cards array in the source column
      sourceColumn.cards = updatedCards;
    } else {
      // Moving card to a different column
      // Remove the card from the source column
      sourceColumn.cards = (sourceColumn.cards || []).filter(
        (id) => id.toString() !== cardId
      );

      // Update the source column
      await sourceColumn.save();

      // Update the destination column
      const destinationColumn = await Column.findById(destinationColumnId);
      if (!destinationColumn) {
        throw new HttpError(404, "Destination column not found");
      }

      // Add the card to the destination column
      destinationColumn.cards = destinationColumn.cards || [];
      destinationColumn.cards.splice(destinationIndex, 0, cardId);
      await destinationColumn.save();

      // Update the card owner to the destination column
      card.owner = destinationColumnId;
    }

    await card.save();

    res.json(card);
  } catch (error) {
    console.error("Error in setNewCardOwner:", error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
}
module.exports = {
  getById: controllerWrapper(getById),
  addNew: controllerWrapper(addNew),
  removeById: controllerWrapper(removeById),
  updateById: controllerWrapper(updateById),
  setNewCardOwner: controllerWrapper(setNewCardOwner),
};
