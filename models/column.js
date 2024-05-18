const { Schema, model } = require("mongoose");

const MongooseError = require("../helpers/MongooseError");

const columnSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Dashboard",
      required: true,
    },
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: "Card",
      },
    ],
  },
  { timestamps: true }
);

const Column = model("Column", columnSchema);

module.exports = Column;
