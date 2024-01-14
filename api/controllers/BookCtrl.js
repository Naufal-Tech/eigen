import moment from "moment-timezone";
import { NotFoundError } from "../errors/index.js";
const defaultDate = () => moment.tz(Date.now(), "Asia/Jakarta").valueOf();
const current_date = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

const BookController = {
  create: async function (req, res) {
    try {
      const { code, title, author, stock } = req.body;

      const book = new models.BookDB({
        code,
        title,
        author,
        stock,
        created_by: req.user._id,
      });

      await book.save();

      const createdAt = moment(book.created_at)
        .tz("Asia/Jakarta")
        .format("DD-MM-YYYY HH:mm:ss");

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Book created successfully",
        _id: book._id,
        code: code,
        title: title,
        author: author,
        stock: stock,
        created_by: req.user._id,
        created_at: createdAt,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Book creation failed",
      });
    }
  },

  // Detail Book
  detail: async function (req, res) {
    const { id } = req.params;

    try {
      const book = await models.BookDB.findOne({
        _id: id,
        deleted_by: { $exists: false },
        deleted_at: { $exists: false },
      });

      if (!book) {
        return response.error(404, "Book is not found", res);
      }

      const createdAt = moment(book.created_at)
        .tz("Asia/Jakarta")
        .format("DD-MM-YYYY HH:mm:ss");

      const updatedAt = moment(book.updated_at)
        .tz("Asia/Jakarta")
        .format("DD-MM-YYYY HH:mm:ss");

      const responseData = {
        _id: book._id,
        code: book.code,
        title: book.title,
        author: book.author,
        stock: book.stock,
        created_at: createdAt,
        updated_at: book.updated_at ? updatedAt : null,
      };

      return response.ok(responseData, res, "Successfully Retrieved Book");
    } catch (err) {
      return response.error(400, err.message, res, err);
    }
  },

  // Get Book:
  get: async function (req, res) {
    const {
      startDate,
      endDate,
      title,
      code,
      author,
      stock,
      page = 1,
      limit = 10,
      sort = "Recently",
    } = req.query;

    try {
      const queryObject = {
        deleted_at: { $exists: false },
        deleted_by: { $exists: false },
      };

      if (startDate) {
        queryObject.created_at = {
          $gte: moment(startDate).startOf("day").valueOf(),
        };
      }

      if (endDate) {
        queryObject.created_at = {
          ...queryObject.created_at,
          $lte: moment(endDate).endOf("day").valueOf(),
        };
      }

      if (title) {
        queryObject.title = title;
      }

      if (code) {
        queryObject.code = code;
      }

      if (author) {
        queryObject.author = author;
      }

      if (stock) {
        const numericStock = parseInt(stock);
        if (!isNaN(numericStock)) {
          queryObject.stock = numericStock;
        } else {
          console.warn("Invalid stock value:", stock);
        }
      }

      // tambahan kondisi untuk exclude books with stock equal to 0.
      queryObject.stock = { $gt: 0 };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      let sortOption = {};
      if (sort === "Recently") {
        sortOption = { created_at: -1 };
      } else if (sort === "Oldest") {
        sortOption = { created_at: 1 };
      } else if (sort === "A-Z") {
        sortOption = { title: 1 };
      } else if (sort === "Z-A") {
        sortOption = { title: -1 };
      } else {
        sortOption = { created_at: -1 };
      }

      const book = await models.BookDB.find(queryObject)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      const totalBook = await models.BookDB.countDocuments(queryObject);

      const booksWithFormattedDates = book.map((item) => {
        return {
          ...item.toObject(),
          created_at: moment(item.created_at)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY HH:mm:ss"),
          updated_at: item.updated_at
            ? moment(item.updated_at)
                .tz("Asia/Jakarta")
                .format("DD-MM-YYYY HH:mm:ss")
            : null,
        };
      });

      res.status(StatusCodes.OK).json({
        book: booksWithFormattedDates,
        currentPage: page,
        totalBook,
        numOfPages: Math.ceil(totalBook / parseInt(limit)),
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch book",
      });
    }
  },

  // Delete Book
  delete: async function (req, res) {
    const { book_id } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const book = await models.BookDB.findOne({ _id: book_id });

      if (!book) {
        throw new NotFoundError(
          `Delete Presensi failed, Presensi does not exist with id: ${book_id}`
        );
      }

      const deletionInfo = {
        deleted_at: defaultDate(),
        deleted_by: req.user._id,
      };

      await models.BookDB.updateOne({ _id: book_id }, deletionInfo, {
        session,
      });

      await session.commitTransaction();
      session.endSession();

      res
        .status(StatusCodes.OK)
        .json({ success: true, message: "Successfully Delete a Book" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Delete Presensi failed, an error occurred while deleting the Book with id: ${book_id}`,
      });
    }
  },

  borrowBook: async (req, res) => {
    try {
      const { book_code } = req.body;

      const book = await models.BookDB.findOne({ code: book_code });

      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Book not found",
        });
      }

      // Check if the book is available (stock > 0)
      if (book.stock <= 0) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Book is not available for borrowing",
        });
      }

      // Find user from req.user._id
      const user = await models.UserDB.findById(req.user._id);

      // Checking jika user apakah telah meminjam buku maksimal 2 buku (allowed books)
      if (user.borrowed_book.length >= 2) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "You have already borrowed the maximum allowed books",
        });
      }

      // Check jika user telah meminjam buku ini sebelumnya biar tidak double input
      if (user.borrowed_book.includes(book._id.toString())) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "You have already borrowed this book",
        });
      }

      // Update user borrowed_book field
      user.borrowed_book.push(book._id);

      // Update user's borrowed_history field
      user.borrow_history.push({
        book_id: book._id,
        code: book.code,
        borrowed_at: defaultDate(),
      });

      // Mengurangi stock of the book
      book.stock--;

      // Save changes to the database
      await mongoose.startSession();
      await mongoose.connection.transaction(async (session) => {
        await user.save({ session });
        await book.save({ session });
      });

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Book Borrowed Successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to borrow book",
      });
    }
  },

  // Mengembalikan buku
  returnBook: async (req, res) => {
    try {
      const { book_code } = req.body;

      const book = await models.BookDB.findOne({ code: book_code });

      if (!book) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Book not found",
        });
      }

      // Find the user by _id from req.user._id
      const user = await models.UserDB.findById(req.user._id);

      // Check jika user telah meminjam buku ini
      if (!user.borrowed_book.includes(book._id.toString())) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "You have not borrowed this book",
        });
      }

      // Update return_history for the specific buku yang dipinjam
      const existingBorrowHistory = user.borrow_history.find(
        (history) =>
          history.book_id.toString() === book._id.toString() &&
          !history.returned_at
      );

      if (existingBorrowHistory) {
        existingBorrowHistory.returned_at = defaultDate();
      }

      // Remove the book from user's borrowed_book
      user.borrowed_book = user.borrowed_book.filter(
        (borrowedBookId) => borrowedBookId.toString() !== book._id.toString()
      );

      // Mengembalikan the stock of the book
      book.stock++;

      // Save changes to the database
      await mongoose.startSession();
      await mongoose.connection.transaction(async (session) => {
        await user.save({ session });
        await book.save({ session });
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Book Returned Successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to return book",
      });
    }
  },
};

export default BookController;
