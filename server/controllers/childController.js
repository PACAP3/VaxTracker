const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Child = require("../models/childModel");
const APIFeatures = require("../utils/apiFeatures");
const authController = require("./authController");

exports.getAllChildren = catchAsync(async (req, res, next) => {
  let filter;
  if (req.user.role === "user") filter = { userId: req.user.id };
  else if (req.user.role === "hospital") filter = { hospitalId: req.user.id };
  const features = new APIFeatures(Child.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const fetchedChildren = await features.query;

  res.status(200).json({
    status: "success",
    results: fetchedChildren.length,
    data: fetchedChildren,
  });
});

exports.createChild = catchAsync(async (req, res, next) => {
  req.body.userId = req.user.id;
  const newChild = await Child.create(req.body);

  res.status(201).json({
    status: "success",
    data: newChild,
  });
});

exports.getOneChild = catchAsync(async (req, res, next) => {
  const fetchedChild = await Child.findById(req.params.id);
  if (!fetchedChild) {
    return next(new AppError(`Child with that id does not exist`, 404));
  }

  if (!authController.isAuthorized(req.user, fetchedChild, "hospital", "user"))
    return next(
      new AppError("You are unauthorized to perform this action", 401)
    );

  res.status(200).json({
    status: "success",
    data: fetchedChild,
  });
});

exports.updateChild = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const fetchedItem = await Child.findById(req.params.id);
  if (!fetchedItem) {
    return next(new AppError("No child with that id was found", 404));
  }

  if (!authController.isAuthorized(req.user, fetchedItem, "user"))
    return next(
      new AppError("You are unauthorized to perform this action", 401)
    );

  const updatedChild = await Child.findByIdAndUpdate(
    req.params.id,
    { name },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: updatedChild,
  });
});

exports.deleteChild = catchAsync(async (req, res, next) => {
  const fetchedChild = await Child.findById(req.params.id);
  if (!fetchedChild) {
    return next(new AppError("No child with that id was found", 404));
  }
  if (!authController.isAuthorized(req.user, fetchedChild, "user"))
    return next(
      new AppError("You are unauthorized to perform this action", 401)
    );
  const deletedChild = await Child.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: "success",
    data: deletedChild,
  });
});
