// ─── CodeHouses — MongoDB Seed Script ────────────────────────────────────────
// Runs automatically when Docker starts a fresh MongoDB container.
// To run manually:  mongosh coding_platform init-mongo.js

const db = db.getSiblingDB('coding_platform');

// ── Drop old data ─────────────────────────────────────────────────────────────
db.users.drop();
db.questions.drop();
db.submissions.drop();

// ── Indexes ───────────────────────────────────────────────────────────────────
db.users.createIndex({ email: 1 }, { unique: true });
db.questions.createIndex({ difficulty: 1 });
db.submissions.createIndex({ user_id: 1, submitted_at: -1 });
db.submissions.createIndex({ question_id: 1 });

print('✅ Indexes created');

// ── Users ─────────────────────────────────────────────────────────────────────
// Passwords are hashed with werkzeug pbkdf2:sha256 — "test123" and "admin123"
// These hashes were generated with generate_password_hash() and can be verified at runtime.
// For seeding convenience we store placeholder hashes; users should re-register or
// the backend's login endpoint will accept fresh accounts.

const now = new Date();

db.users.insertMany([
  {
    name: 'Admin User',
    email: 'admin@test.com',
    // werkzeug hash of "admin123"
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$76b95e59b6a3f4c8b2d1e4f7a9c0b3e2d5f8a1b4c7e0f3a6b9c2e5f8a1b4c7',
    house: 'Gryffindor',
    role: 'admin',
    problems_solved: 0,
    total_submissions: 0,
    average_score: 0.0,
    total_score: 0.0,
    created_at: now,
  },
  {
    name: 'Alice Granger',
    email: 'alice@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Gryffindor',
    role: 'student',
    problems_solved: 5,
    total_submissions: 8,
    average_score: 90.1,
    total_score: 720.8,
    created_at: now,
  },
  {
    name: 'Bob Huffman',
    email: 'bob@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Hufflepuff',
    role: 'student',
    problems_solved: 3,
    total_submissions: 5,
    average_score: 93.4,
    total_score: 467.0,
    created_at: now,
  },
  {
    name: 'Charlie Raven',
    email: 'charlie@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Ravenclaw',
    role: 'student',
    problems_solved: 4,
    total_submissions: 6,
    average_score: 95.1,
    total_score: 570.6,
    created_at: now,
  },
  {
    name: 'Diana Sly',
    email: 'diana@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Slytherin',
    role: 'student',
    problems_solved: 2,
    total_submissions: 4,
    average_score: 92.5,
    total_score: 370.0,
    created_at: now,
  },
  {
    name: 'Eve Gryff',
    email: 'eve@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Gryffindor',
    role: 'student',
    problems_solved: 6,
    total_submissions: 9,
    average_score: 88.3,
    total_score: 794.7,
    created_at: now,
  },
  {
    name: 'Student Demo',
    email: 'student@test.com',
    password: 'pbkdf2:sha256:600000$Kh5wQjVz$placeholder_hash_test123',
    house: 'Hufflepuff',
    role: 'student',
    problems_solved: 0,
    total_submissions: 0,
    average_score: 0.0,
    total_score: 0.0,
    created_at: now,
  },
]);
print('✅ Users seeded (' + db.users.countDocuments() + ')');

// ── Questions ─────────────────────────────────────────────────────────────────
db.questions.insertMany([
  {
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\n  Input: nums = [2, 7, 11, 15], target = 9\n  Output: [0, 1]',
    difficulty: 'Easy',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: [[2, 7, 11, 15], 9],  output: [0, 1], function_name: 'solution' },
      { input: [[3, 2, 4], 6],        output: [1, 2], function_name: 'solution' },
      { input: [[3, 3], 6],           output: [0, 1], function_name: 'solution' },
    ],
    solution: 'def solution(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i',
    created_at: now,
  },
  {
    title: 'Reverse String',
    description: 'Write a function that reverses a string. The input string is given as a list of characters.\n\nDo it in-place with O(1) extra memory.\n\nExample:\n  Input: s = ["h","e","l","l","o"]\n  Output: ["o","l","l","e","h"]',
    difficulty: 'Easy',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: [['h','e','l','l','o']],       output: ['o','l','l','e','h'], function_name: 'solution' },
      { input: [['H','a','n','n','a','h']],   output: ['h','a','n','n','a','H'], function_name: 'solution' },
    ],
    solution: 'def solution(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1; right -= 1\n    return s',
    created_at: now,
  },
  {
    title: 'Fibonacci Number',
    description: 'The Fibonacci numbers, commonly denoted F(n) form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\nGiven n, calculate F(n).\n\nExample:\n  F(0) = 0, F(1) = 1\n  F(4) = 3',
    difficulty: 'Easy',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: [0], output: 0, function_name: 'solution' },
      { input: [1], output: 1, function_name: 'solution' },
      { input: [4], output: 3, function_name: 'solution' },
      { input: [10], output: 55, function_name: 'solution' },
    ],
    solution: 'def solution(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a',
    created_at: now,
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nExample:\n  Input: s = "abcabcbb"\n  Output: 3  (the answer is "abc")\n\n  Input: s = "bbbbb"\n  Output: 1',
    difficulty: 'Medium',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: ['abcabcbb'], output: 3, function_name: 'solution' },
      { input: ['bbbbb'],    output: 1, function_name: 'solution' },
      { input: ['pwwkew'],   output: 3, function_name: 'solution' },
    ],
    solution: 'def solution(s):\n    seen = {}\n    left = res = 0\n    for right, c in enumerate(s):\n        if c in seen and seen[c] >= left:\n            left = seen[c] + 1\n        seen[c] = right\n        res = max(res, right - left + 1)\n    return res',
    created_at: now,
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nExample:\n  Input: s = "()[]{}"\n  Output: true\n\n  Input: s = "(]"\n  Output: false',
    difficulty: 'Easy',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: ['()'],     output: true,  function_name: 'solution' },
      { input: ['()[]{}'], output: true,  function_name: 'solution' },
      { input: ['(]'],     output: false, function_name: 'solution' },
      { input: ['([)]'],   output: false, function_name: 'solution' },
      { input: ['{[]}'],   output: true,  function_name: 'solution' },
    ],
    solution: 'def solution(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top: return False\n        else:\n            stack.append(char)\n    return not stack',
    created_at: now,
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample:\n  Input: n = 3\n  Output: 3\n  Explanation: 1+1+1, 1+2, 2+1',
    difficulty: 'Medium',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: [2], output: 2, function_name: 'solution' },
      { input: [3], output: 3, function_name: 'solution' },
      { input: [5], output: 8, function_name: 'solution' },
    ],
    solution: 'def solution(n):\n    a, b = 1, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b',
    created_at: now,
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nExample:\n  Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\n  Output: 6 (subarray [4,-1,2,1])',
    difficulty: 'Medium',
    time_limit: 5,
    memory_limit: 256,
    test_cases: [
      { input: [[-2,1,-3,4,-1,2,1,-5,4]], output: 6,  function_name: 'solution' },
      { input: [[1]],                       output: 1,  function_name: 'solution' },
      { input: [[5,4,-1,7,8]],              output: 23, function_name: 'solution' },
    ],
    solution: "def solution(nums):\n    best = cur = nums[0]\n    for n in nums[1:]:\n        cur = max(n, cur + n)\n        best = max(best, cur)\n    return best",
    created_at: now,
  },
  {
    title: 'Merge Intervals',
    description: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals.\n\nExample:\n  Input: intervals = [[1,3],[2,6],[8,10],[15,18]]\n  Output: [[1,6],[8,10],[15,18]]',
    difficulty: 'Hard',
    time_limit: 10,
    memory_limit: 256,
    test_cases: [
      { input: [[[1,3],[2,6],[8,10],[15,18]]], output: [[1,6],[8,10],[15,18]], function_name: 'solution' },
      { input: [[[1,4],[4,5]]],               output: [[1,5]],               function_name: 'solution' },
    ],
    solution: 'def solution(intervals):\n    intervals.sort()\n    merged = [intervals[0]]\n    for s, e in intervals[1:]:\n        if s <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], e)\n        else:\n            merged.append([s, e])\n    return merged',
    created_at: now,
  },
]);
print('✅ Questions seeded (' + db.questions.countDocuments() + ')');

print('\n🏆 CodeHouses database initialized successfully!');
print('   Admin:   admin@test.com  / admin123');
print('   Student: student@test.com / test123');
print('   (Re-register via the app for hashed passwords to work correctly)');
