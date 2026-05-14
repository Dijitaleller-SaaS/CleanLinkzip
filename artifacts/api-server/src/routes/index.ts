import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import googleAuthRouter from "./google-auth";
import vendorsRouter from "./vendors";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import cmsRouter from "./cms";
import pilotRouter from "./pilot";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import sitemapRouter from "./sitemap";
import couponsRouter from "./coupons";
import paytrRouter from "./paytr";
import bayiRouter from "./bayi";
import ogAuditRouter from "./og-audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(googleAuthRouter);
router.use(vendorsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(cmsRouter);
router.use(pilotRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(sitemapRouter);
router.use(couponsRouter);
router.use(paytrRouter);
router.use(bayiRouter);
router.use(ogAuditRouter);

export default router;
