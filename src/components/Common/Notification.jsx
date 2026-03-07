import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getVendorNotifications,
  markNotificationAsRead,
} from "../../api/vendorApi";
import "./Notification.css";
import { Bell, Check, Trash2 } from "lucide-react";

const Notification = ({ expiryDate: propsExpiryDate }) => {
  const { vendorId } = useSelector((state) => state.vendorAuth);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (vendorId) {
      try {
        const data = await getVendorNotifications();
        if (data && data.status && data.notifications) {
          const formatted = data.notifications.map((n) => {
            let icon = "🔔";
            let typeClass = "info";
            if (n.type === "plan_upgrade") {
              icon = "⭐";
              typeClass = "success";
            } else if (n.type === "asset_upgrade") {
              icon = "💎";
              typeClass = "primary";
            } else if (n.type === "new_registration") {
              icon = "🎉";
              typeClass = "success";
            } else if (n.type === "subscription_alert") {
              icon = "⚠️";
              typeClass = "warning";
            } else if (n.type === "other") {
              icon = "ℹ️";
              typeClass = "info";
            }

            if (n.title === "Subscription Expired") {
              icon = "🚫";
              typeClass = "danger";
            }

            return {
              id: n._id,
              type: typeClass,
              icon,
              title: n.title,
              message: n.message,
              time: new Date(n.createdAt).toLocaleDateString(),
              link: n.link || null,
              isRead: n.isRead,
            };
          });
          setNotifications(formatted);
          setUnreadCount(formatted.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 1 minute for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [vendorId]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      // Refresh list locally
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read when clicked
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
      } catch (err) {}
    }

    if (notif.link) {
      navigate(notif.link);
    }
    setIsOpen(false);
    fetchNotifications();
  };

  return (
    <div className="notification-icon-container" ref={dropdownRef}>
      <div
        className="icon-btn"
        onClick={handleToggle}
        style={{ position: "relative" }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <span>Notifications</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              {unreadCount} Unread
            </span>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.type} ${notif.isRead ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">{notif.icon}</div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notif.title}
                      <button
                        className="mark-read-btn"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{notif.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
