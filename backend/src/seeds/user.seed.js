import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const seedUsers = [
  // Female Users
  {
    email: "malini.singh@example.com",
    fullName: "Malini Singh",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    email: "prateeksha.m@example.com",
    fullName: "Prateeksha M",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    email: "surabhi.devi@example.com",
    fullName: "Surabhi Devi",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    email: "avani.bhat@example.com",
    fullName: "Avani Bhat",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    email: "ishani.bhaskar@example.com",
    fullName: "Ishani Bhaskar",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    email: "mitra.gupta@example.com",
    fullName: "Mitra Gupta",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/6.jpg",
  },
  {
    email: "chaitra.murthy@example.com",
    fullName: "Chaitra Murthy",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/7.jpg",
  },
  {
    email: "aadya.gargi@example.com",
    fullName: "Aadya Gargi",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/women/8.jpg",
  },

  // Male Users
  {
    email: "mithun.bhatia@example.com",
    fullName: "Mithun Bhatia",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    email: "Vikram.chaudhary@example.com",
    fullName: "Vikram Chaudhary",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    email: "Bhairav.bhat@example.com",
    fullName: "Bhairav Bhat",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    email: "Dheeraj.mayur@example.com",
    fullName: "Dheeraj Mayur",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    email: "hemanth.dwivedi@example.com",
    fullName: "Hemanth Dwivedi",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    email: "akhil.warrior@example.com",
    fullName: "Akhil Warrior",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    email: "dhyan.rao@example.com",
    fullName: "Dhyan Rao",
    password: "123456",
    profilePic: "https://randomuser.me/api/portraits/men/7.jpg",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await User.insertMany(seedUsers);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Call the function
seedDatabase();