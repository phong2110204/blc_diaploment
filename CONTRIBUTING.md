# Contribution Guide

## 🤝 Cách Đóng Góp

Cảm ơn bạn muốn đóng góp cho dự án! Vui lòng tuân theo các hướng dẫn này.

## 📋 Quy Trình Đóng Góp

### 1. Fork Repository
```bash
git clone https://github.com/your-username/QLVB.git
```

### 2. Tạo Branch Feature
```bash
git checkout -b feature/your-feature-name
```

### 3. Commit Changes
```bash
git commit -m "Add: Brief description of changes"
```

### 4. Push Branch
```bash
git push origin feature/your-feature-name
```

### 5. Tạo Pull Request
- Mô tả chi tiết những thay đổi
- Liên kết các issue liên quan
- Include screenshots nếu cần

## 📝 Commit Message Convention

```
[TYPE]: Brief description

Detailed explanation of changes (if needed)

- Change 1
- Change 2
- Change 3
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactor
- `test`: Tests
- `chore`: Build/config

## ✅ Coding Standards

### Solidity
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use 4 spaces indentation
- Add natspec comments

### JavaScript
- Use ES6+ syntax
- Use async/await
- Add error handling
- Comment complex logic

### React
- Use functional components
- Use hooks (useState, useEffect)
- Proper prop validation
- Meaningful component names

## 🧪 Testing Requirements

- All new features must have tests
- Run tests before submitting PR
- Maintain 80%+ code coverage

```bash
# Run tests
npm test

# Check coverage
npm run coverage
```

## 📋 Pull Request Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] No breaking changes
- [ ] PR title is descriptive

## 🐛 Reporting Bugs

Create an issue with:
1. Title: Clear bug description
2. Environment: OS, Node version, Browser
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Screenshots (if applicable)

## 💡 Suggesting Features

Create an issue with:
1. Title: Feature name
2. Description: What & why
3. Use cases: How it helps
4. Acceptance criteria

## 🔒 Security Issues

**Do NOT** create public issues for security bugs!

Email: security@example.com

---

**Thank you for contributing! 🙏**
