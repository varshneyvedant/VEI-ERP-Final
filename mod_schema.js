const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove enum blocks
content = content.replace(/enum \w+ \{[^}]+\}\n*/g, '');

// Replace provider
content = content.replace('provider = "postgresql"', 'provider = "sqlite"');

// Replace field types
content = content.replace(/role\s+Role/g, 'role     String');
content = content.replace(/type\s+TransactionType/g, 'type           String');
content = content.replace(/status\s+AttendanceStatus/g, 'status      String');
content = content.replace(/type\s+ScrapType/g, 'type      String');

// Handle statuses with defaults
content = content.replace(/status\s+ExpenseStatus\s+@default\(UNPAID\)/g, 'status       String @default("UNPAID")');
content = content.replace(/status\s+ApprovalStatus\s+@default\(APPROVED\)/g, 'status         String @default("APPROVED")');

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema modified successfully.');
