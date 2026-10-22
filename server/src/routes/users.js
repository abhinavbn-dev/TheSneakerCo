
import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

router.use(protect);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const profileDir = path.resolve(currentDir, "../../uploads/profiles");

fs.mkdirSync(profileDir, { recursive: true });

const allowedImageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const uploadProfilePicture = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, profileDir);
    },
    filename: (req, file, callback) => {
      const extension = allowedImageTypes[file.mimetype];

      if (!extension) {
        return callback(
          new Error("Only JPG, PNG, and WebP images are allowed.")
        );
      }

      callback(null, `${req.user._id}-${Date.now()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes[file.mimetype]) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    callback(null, true);
  },
});

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  city: user.city || "",
  role: user.role,
  profilePicture: user.profilePicture || "",
});

function receiveProfilePicture(req, res, next) {
  uploadProfilePicture.single("profilePicture")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : error.message || "Could not upload the image.",
      });
    }

    next();
  });
}

// Get current user
router.get("/me", (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// Update profile details and password
router.put(
  "/me",
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      currentPassword,
      newPassword,
    } = req.body || {};

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
          message: "Enter a valid email address",
        });
      }

      const other = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (other) {
        return res.status(409).json({
          message: "That email is already in use",
        });
      }

      if (normalizedEmail !== user.email && user.role !== "admin") {
        user.email = normalizedEmail;
        user.isEmailVerified = false;
      }
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (newPassword) {
      if (
        typeof currentPassword !== "string" ||
        !(await bcrypt.compare(currentPassword, user.password))
      ) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      if (String(newPassword).length < 8) {
        return res.status(400).json({
          message: "New password must contain at least 8 characters",
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      user: safeUser(user),
    });
  })
);

// Upload profile picture: customer accounts only
router.post(
  "/me/profile-picture",
  receiveProfilePicture,
  asyncHandler(async (req, res) => {
    if (req.user.role === "admin") {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(403).json({
        message:
          "Profile picture uploads are available for customer accounts only.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a profile picture.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const previousPicture = user.profilePicture;

    user.profilePicture =
      `/uploads/profiles/${req.file.filename}`;

    await user.save();

    // Remove the previous locally stored picture after the new one saves.
    if (
      previousPicture &&
      previousPicture.startsWith("/uploads/profiles/")
    ) {
      const previousPath = path.join(
        profileDir,
        path.basename(previousPicture)
      );

      if (previousPath !== req.file.path) {
        fs.unlink(previousPath, () => {});
      }
    }

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
      user: safeUser(user),
    });
  })
);

// Get saved addresses
router.get("/me/addresses", (req, res) => {
  res.json({
    addresses: req.user.addresses || [],
  });
});

// Add an address
router.post(
  "/me/addresses",
  asyncHandler(async (req, res) => {
    const {
      name,
      line1,
      city,
      state,
      pincode,
      phone,
    } = req.body || {};

    if (
      ![name, line1, city, state, pincode, phone].every(
        (value) => typeof value === "string" && value.trim()
      )
    ) {
      return res.status(400).json({
        message: "Complete all address fields",
      });
    }

    req.user.addresses.push({
      name: name.trim(),
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
    });

    await req.user.save();

    res.status(201).json({
      address: req.user.addresses[req.user.addresses.length - 1],
      addresses: req.user.addresses,
    });
  })
);

// Delete an address
router.delete(
  "/me/addresses/:id",
  asyncHandler(async (req, res) => {
    req.user.addresses = req.user.addresses.filter(
      (address) => String(address._id) !== req.params.id
    );

    await req.user.save();

    res.json({
      success: true,
      addresses: req.user.addresses,
    });
  })
);

// NEW: Delete the logged-in customer's account
router.delete(
  "/me",
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Enter your current password to delete your account.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    // This customer endpoint must not delete administrator accounts.
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be deleted here.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Incorrect password. Your account was not deleted.",
      });
    }

    const picture = user.profilePicture;
    const userId = user._id;

    await User.deleteOne({ _id: userId });

    // Remove the customer's locally stored picture, if applicable.
    if (picture && picture.startsWith("/uploads/profiles/")) {
      const picturePath = path.join(
        profileDir,
        path.basename(picture)
      );

      fs.unlink(picturePath, () => {});
    }

    return res.json({
      success: true,
      message: "Your account has been deleted successfully.",
    });
  })
);

export default router;
