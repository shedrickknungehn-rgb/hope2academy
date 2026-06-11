import { Router, type IRouter } from "express";
import healthRouter    from "./health.js";
import authRouter      from "./auth.js";
import usersRouter     from "./users.js";
import statsRouter     from "./stats.js";
import dataRouter      from "./data.js";
import storageRouter   from "./storage.js";
import chatRouter      from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(statsRouter);
router.use(storageRouter);
router.use(chatRouter);
router.use(dataRouter);

export default router;
