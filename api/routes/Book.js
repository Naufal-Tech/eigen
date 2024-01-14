import express from "express";
import Controller from "../controllers/BookCtrl.js";
import middleware from "../middleware/Auth.js";
import { upload } from "../middleware/multerMiddleware.js";

const bookRouter = express.Router();

// BOOK CREATE (POST): /api/v1/book
bookRouter.post(
  "/",
  upload.none(),
  middleware.protect,
  middleware.adminAuthMiddleware,
  Controller.create
);

// BOOK DETAIL (GET): /api/v1/book/detail/:id
bookRouter.get(
  "/detail/:id",
  upload.none(),
  middleware.protect,
  Controller.detail
);

// BOOK VIEW ALL (GET): /api/v1/book/detail/:id
bookRouter.get("/", upload.none(), middleware.protect, Controller.get);

// BOOK BORROW (POST): /api/v1/book/book-borrow
bookRouter.post(
  "/book-borrow",
  upload.none(),
  middleware.protect,
  Controller.borrowBook
);

// BOOK BORROW (POST): /api/v1/book/book-return
bookRouter.post(
  "/book-return",
  upload.none(),
  middleware.protect,
  Controller.returnBook
);

// BOOK RETURN (DELETE): /api/v1/book/delete
bookRouter.delete(
  "/",
  upload.none(),
  middleware.protect,
  middleware.adminAuthMiddleware,
  Controller.delete
);

export default bookRouter;
