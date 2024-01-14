import addressRouter from "./routes/Address.js";
import bookRouter from "./routes/Book.js";
import userRouter from "./routes/User.js";

const routes = (app) => {
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/address", addressRouter);
  app.use("/api/v1/book", bookRouter);
};

export default routes;
