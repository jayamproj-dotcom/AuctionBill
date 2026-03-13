import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import SessionModal from "./SessionModal";
import { adminHeartbeat } from "../../api/adminApi";
import { mainVendorHeartbeat } from "../../api/mainVendorApi";
import { vendorHeartbeat } from "../../api/vendorApi";
import { setSaasSessionError } from "../../redux/slices/saasAuthSlice";
import { setVendorSessionError } from "../../redux/slices/vendorAuthSlice";

// ─── Constants ────────────────────────────────────────────────────────────────
const INACTIVITY_LIMIT   = 5  * 60 * 1000; // 5 minutes
const CHECK_INTERVAL     = 10 * 1000;       // 10 seconds
const HEARTBEAT_INTERVAL = 30 * 1000;       // 30 seconds
const ACTIVITY_THRESHOLD = 15 * 1000;       // 15 seconds

// ─── Storage keys per role ────────────────────────────────────────────────────
// We persist lastActivity in sessionStorage so it survives F5/Ctrl+R but is
// cleared when the browser tab is truly closed (beforeunload without refresh).
const ACTIVITY_KEY = {
  saas:       "sm_last_activity_saas",
  mainvendor: "sm_last_activity_mainvendor",
  vendor:     "sm_last_activity_vendor",
};

const getStoredActivity = (role) => {
  const raw = sessionStorage.getItem(ACTIVITY_KEY[role]);
  return raw ? parseInt(raw, 10) : Date.now();
};

const setStoredActivity = (role, time) => {
  if (role) sessionStorage.setItem(ACTIVITY_KEY[role], String(time));
};

// ─────────────────────────────────────────────────────────────────────────────

const SessionManager = () => {
  const location = useLocation();
  const dispatch  = useDispatch();

  const saasSessionError   = useSelector((s) => s.saasAuth.sessionError);
  const vendorSessionError = useSelector((s) => s.vendorAuth.sessionError);
  const saasToken          = useSelector((s) => s.saasAuth.adminToken);
  const vendorToken        = useSelector((s) => s.vendorAuth.vendorToken);

  // ── Determine active context ──────────────────────────────────────────────
  const isSaaSContext =
    location.pathname.includes("/saas") &&
    !location.pathname.includes("/mainvendor");
  const isMainVendorContext = location.pathname.includes("/mainvendor");
  const isVendorContext =
    location.pathname.includes("/vendor") &&
    !location.pathname.includes("/mainvendor");

  // Resolve the active role regardless of current route so that activity is
  // tracked globally for whichever user is logged in.
  const activeRole = saasToken
    ? "saas"
    : vendorToken
    ? isMainVendorContext
      ? "mainvendor"
      : "vendor"
    : null;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const isRefreshing      = React.useRef(false);
  // lastActivityTime is seeded from sessionStorage so a page reload does NOT
  // reset it to Date.now() — the user keeps their existing idle countdown.
  const lastActivityTime  = React.useRef(
    activeRole ? getStoredActivity(activeRole) : Date.now()
  );
  const lastHeartbeat     = React.useRef(Date.now());

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sendHeartbeat = React.useCallback(async () => {
    lastHeartbeat.current = Date.now();
    try {
      if (saasToken) {
        await adminHeartbeat();
      } else if (vendorToken) {
        if (isMainVendorContext) await mainVendorHeartbeat();
        else                     await vendorHeartbeat();
      }
    } catch {
      // Axios interceptor handles session errors
    }
  }, [saasToken, vendorToken, isMainVendorContext]);

  // ── Effect 1: startup verification + reload detection ─────────────────────
  useEffect(() => {
    const verifySessionOnStartup = async () => {
      const currentToken =
        saasToken ||
        vendorToken ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      if (currentToken && currentToken !== "null") {
        console.log("[SessionManager] Verifying stored session on startup…");
        try {
          if (saasToken)      await adminHeartbeat();
          else if (vendorToken) {
            if (isMainVendorContext) await mainVendorHeartbeat();
            else                     await vendorHeartbeat();
          }
        } catch {
          console.log("[SessionManager] Initial heartbeat failed.");
        }
      }
    };

    verifySessionOnStartup();

    // Clear stale session errors on fresh mount (not on reload — redux rehydrates
    // from the token, not from the error flag, so this is safe).
    if (isSaaSContext)                        dispatch(setSaasSessionError(false));
    else if (isVendorContext || isMainVendorContext) dispatch(setVendorSessionError(false));

    const handleKeyDown = (e) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        isRefreshing.current = true;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Intentionally run once on mount only.

  // ── Effect 2: global activity tracking + inactivity timer ─────────────────
  useEffect(() => {
    // updateActivity is called on ANY user interaction, anywhere on the site.
    // It updates lastActivityTime for the currently-logged-in role and
    // triggers an early heartbeat if enough time has passed.
    const updateActivity = () => {
      if (!activeRole) return;                    // nobody is logged in
      const now = Date.now();
      lastActivityTime.current = now;
      setStoredActivity(activeRole, now);         // persist across reloads

      if (now - lastHeartbeat.current > ACTIVITY_THRESHOLD) {
        sendHeartbeat();
      }
    };

    const checkInactivity = () => {
      if (!activeRole) return;

      const now      = Date.now();
      const idleTime = now - lastActivityTime.current;

      if (idleTime > INACTIVITY_LIMIT) {
        if (saasSessionError || vendorSessionError) return; // modal already up

        console.log("[SessionManager] Session expired due to inactivity.");

        if (saasToken)      dispatch(setSaasSessionError(true));
        else if (vendorToken) dispatch(setVendorSessionError(true));

      } else if (now - lastHeartbeat.current > HEARTBEAT_INTERVAL) {
        sendHeartbeat();
      }
    };

    const timer = setInterval(checkInactivity, CHECK_INTERVAL);

    const events          = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel", "click"];
    const listenerOptions = { capture: true, passive: true };
    events.forEach((e) => window.addEventListener(e, updateActivity, listenerOptions));

    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, updateActivity, listenerOptions));
    };
  }, [
    activeRole,
    saasToken,
    vendorToken,
    saasSessionError,
    vendorSessionError,
    sendHeartbeat,
    dispatch,
  ]);

  // ── Effect 3: browser-close notification (skip on refresh) ────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (isRefreshing.current) {
        console.log("[SessionManager] Reload detected — skipping logout.");
        return;
      }

      // Clear persisted activity so next cold-start begins fresh
      if (activeRole) sessionStorage.removeItem(ACTIVITY_KEY[activeRole]);

      const token =
        saasToken ||
        vendorToken ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") return;

      let endpoint = "";
      if (isSaaSContext)          endpoint = "admin/browser-close";
      else if (isMainVendorContext) endpoint = "main-vendor/browser-close";
      else if (isVendorContext)    endpoint = "vendor/browser-close";

      if (!endpoint) return;

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/";
      const base    = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const fullUrl = `${base}/${endpoint}`;

      console.log(`[SessionManager] Browser close — clearing session: ${fullUrl}`);

      fetch(fullUrl, {
        method:    "POST",
        headers:   { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:      JSON.stringify({ token }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [
    activeRole,
    isSaaSContext,
    isMainVendorContext,
    isVendorContext,
    saasToken,
    vendorToken,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (saasSessionError   && isSaaSContext)                      return <SessionModal type="saas" />;
  if (vendorSessionError && (isVendorContext || isMainVendorContext)) return <SessionModal type="vendor" />;

  return null;
};

export default SessionManager;