import { PrismaClient } from '@prisma/client';
import { subDays, subMonths } from 'date-fns';
import bcrypt from 'bcrypt';
import { reconcileFIFOBook } from '../src/lib/ledger/reconciliation';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic copper factory default values...');

  // 1. Clear all existing data cleanly in foreign-key order
  await prisma.saudaContract.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.billPayment.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.customerLedger.deleteMany();
  await prisma.supplierLedger.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.debitNote.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.scrapInventory.deleteMany();
  await prisma.finishedGoodsBatch.deleteMany();
  await prisma.production.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.advanceRepayment.deleteMany();
  await prisma.advance.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.salaryHistory.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.periodLock.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.user.deleteMany();

  const today = new Date();

  // 1.1 Initial Capital Injection (₹1.50 Crore)
  await prisma.paymentRecord.create({
    data: {
      date: subDays(today, 180),
      amount: 15000000, // ₹1.5 Crore
      type: "INCOMING",
      description: 'Initial Capital Injection'
    }
  });

  // 1.2 Add Default Admin & Operator Accounts
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: { username: 'owner', password: passwordHash, role: "OWNER" }
  });
  await prisma.user.create({
    data: { username: 'manager', password: passwordHash, role: "MANAGER" }
  });
  console.log('✓ Added secure User accounts (owner / manager -> password123)');

  // 2. Add Factory Employees & Payroll History
  const emp1 = await prisma.employee.create({
    data: { name: 'Ramesh Singh', role: 'Wire Drawing Technician', baseSalary: 25000 },
  });
  const emp2 = await prisma.employee.create({
    data: { name: 'Suresh Kumar', role: 'Continuous Casting Operator', baseSalary: 28000 },
  });
  const emp3 = await prisma.employee.create({
    data: { name: 'Amit Patel', role: 'Plant Production Manager', baseSalary: 55000 },
  });

  await prisma.salaryHistory.create({ data: { employeeId: emp1.id, date: subMonths(today, 12), amount: 22000, reason: 'Joining' } });
  await prisma.salaryHistory.create({ data: { employeeId: emp1.id, date: subMonths(today, 3), amount: 25000, reason: 'Annual Increment' } });
  await prisma.salaryHistory.create({ data: { employeeId: emp2.id, date: subMonths(today, 8), amount: 25000, reason: 'Joining' } });
  await prisma.salaryHistory.create({ data: { employeeId: emp2.id, date: subMonths(today, 2), amount: 28000, reason: 'Appraisal' } });

  console.log('✓ Added factory staff and salary records');

  // 3. Add Verified Suppliers & Customers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Global Copper Ltd',
      contact: '9876543210',
      address: 'Plot 42, Industrial Area Phase 1, Mumbai',
      gst: '27AABCU9603R1ZM',
      pan: 'AABCU9603R',
      stateCode: '27',
      bankDetails: 'HDFC Bank, Acct: 50100200300400, IFSC: HDFC0001234',
      creditBalance: 0
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Hindalco Industries',
      contact: '9876543211',
      address: 'Aditya Birla Centre, Worli, Mumbai',
      gst: '27BBDCU9603R1ZN',
      pan: 'BBDCU9603R',
      stateCode: '27',
      bankDetails: 'SBI Bank, Acct: 30200200300401, IFSC: SBIN0001235',
      creditBalance: 0
    }
  });

  const customer1 = await prisma.customer.create({
    data: {
      name: 'ABC Cables',
      contact: '9123456780',
      address: 'Plot 88, Tech Hub, Pune',
      gst: '27XABCU9603R1ZP',
      pan: 'XABCU9603R',
      stateCode: '27',
      transport: 'Fast Track Logistics',
      creditLimit: 2500000, // ₹25 Lakhs
      creditBalance: 0
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'XYZ Electronics',
      contact: '9123456781',
      address: 'Sector 5, Electronics City, Bangalore',
      gst: '29YABCU9603R1ZQ',
      pan: 'YABCU9603R',
      stateCode: '29',
      transport: 'Safe Express',
      creditLimit: 1500000, // ₹15 Lakhs
      creditBalance: 0
    }
  });

  console.log('✓ Added suppliers & customers with credit limits');

  // 4. Add Active Sauda Contracts for Testing
  await prisma.saudaContract.create({
    data: {
      contractNo: 'SAU-2026-001',
      customerId: customer1.id,
      bookingDate: subDays(today, 10),
      expiryDate: subDays(today, -20), // Valid for next 20 days
      totalQtyTons: 50.00,
      remainingQty: 34.00, // 34 Tons remaining
      ratePerKg: 840.00,   // ₹840/kg (₹840,000/ton)
      status: 'ACTIVE',
      notes: 'Quarterly CC Wire Booking'
    }
  });

  await prisma.saudaContract.create({
    data: {
      contractNo: 'SAU-2026-002',
      customerId: customer2.id,
      bookingDate: subDays(today, 5),
      expiryDate: subDays(today, -25),
      totalQtyTons: 25.00,
      remainingQty: 20.00, // 20 Tons remaining
      ratePerKg: 850.00,   // ₹850/kg
      status: 'ACTIVE',
      notes: 'Submersible Winding Wire Booking'
    }
  });

  console.log('✓ Created active Sauda contracts (ABC Cables: 34T @ ₹840, XYZ: 20T @ ₹850)');

  // 5. Daily Market Prices (Last 90 Days) -> ~₹835 - ₹860/kg
  for (let i = 0; i < 90; i++) {
    const d = subDays(today, i);
    const dailyCopperRate = 835000 + Math.floor(Math.random() * 25000); // ₹835 - ₹860 / kg
    await prisma.marketPrice.create({
      data: { date: d, price: dailyCopperRate }
    });
  }
  console.log('✓ Added realistic daily MCX copper prices (~₹840/kg)');

  // 6. Purchases of Raw Copper Rod (Last 60 Days)
  const purchasesList = [
    { daysAgo: 50, qty: 20.0, pricePerTon: 835000, supplier: supplier1, isPaid: true },
    { daysAgo: 35, qty: 25.0, pricePerTon: 840000, supplier: supplier2, isPaid: true },
    { daysAgo: 20, qty: 20.0, pricePerTon: 842000, supplier: supplier1, isPaid: true },
    { daysAgo: 8,  qty: 25.0, pricePerTon: 845000, supplier: supplier2, isPaid: false },
    { daysAgo: 2,  qty: 20.0, pricePerTon: 848000, supplier: supplier1, isPaid: false }
  ];

  for (const p of purchasesList) {
    const pDate = subDays(today, p.daysAgo);
    const totalVal = p.qty * p.pricePerTon;
    const amtPaid = p.isPaid ? totalVal : 0;

    const purchase = await prisma.purchase.create({
      data: {
        supplierId: p.supplier.id,
        date: pDate,
        qty: p.qty,
        pricePerTon: p.pricePerTon,
        totalValue: totalVal,
        amountPaid: amtPaid,
        fullyPaidDate: p.isPaid ? subDays(pDate, 2) : null
      }
    });

    await prisma.inventoryBatch.create({
      data: {
        purchaseId: purchase.id,
        date: pDate,
        initialQty: p.qty,
        remainingQty: p.qty,
        pricePerTon: p.pricePerTon
      }
    });

    await prisma.supplierLedger.create({
      data: {
        supplierId: p.supplier.id,
        date: pDate,
        amount: totalVal,
        description: `Raw Copper Purchase (${p.qty}T @ ₹${(p.pricePerTon / 1000).toFixed(0)}/kg)`
      }
    });

    if (p.isPaid) {
      await prisma.supplierLedger.create({
        data: {
          supplierId: p.supplier.id,
          date: subDays(pDate, 2),
          amount: -totalVal,
          description: `Bank Payment for Purchase ID: ${purchase.id}`
        }
      });

      const pRec = await prisma.paymentRecord.create({
        data: {
          date: subDays(pDate, 2),
          amount: totalVal,
          type: "OUTGOING",
          supplierId: p.supplier.id,
          description: `Payment to ${p.supplier.name} for ${p.qty}T Copper Rod`
        }
      });

      await prisma.billPayment.create({
        data: {
          paymentRecordId: pRec.id,
          purchaseId: purchase.id,
          amountApplied: totalVal
        }
      });
    }
  }
  console.log('✓ Added realistic raw copper purchases & supplier ledger entries');

  // 7. Manufacturing & Finished Goods Production
  const ccBrands = ['Poly Vansh', 'Poly Unnati', 'Poly Unique Plus', 'Poly Unique Plus Premium'];
  const subBrands = ['Poly Lifeline', 'Poly Life Plus'];

  for (let i = 0; i < 45; i++) {
    const pDate = subDays(today, i);
    const rawUsed = 1.5 + (i % 3) * 0.5; // 1.5T to 2.5T daily
    const wireProduced = rawUsed * 0.97;  // 97% yield
    const scrapGen = rawUsed - wireProduced; // 3% scrap

    const isCC = i % 2 === 0;
    const category = isCC ? 'CC Wires' : 'Submersible Winding Wire';
    const brand = isCC ? ccBrands[i % ccBrands.length] : subBrands[i % subBrands.length];
    const wireSize = (i % 3 === 0) ? '1mm' : (i % 3 === 1) ? '2mm' : '3mm';

    await prisma.production.create({
      data: {
        date: pDate,
        rawCopperUsed: rawUsed,
        productCategory: category,
        brand,
        wireType: wireSize,
        wireProduced,
        scrapGenerated: scrapGen,
        finishedGoodsBatch: {
          create: {
            date: pDate,
            productCategory: category,
            brand,
            wireType: wireSize,
            initialQty: wireProduced,
            remainingQty: wireProduced,
            costPerTon: 845000
          }
        }
      }
    });

    await prisma.scrapInventory.create({
      data: {
        date: pDate,
        type: "GENERATED",
        qty: scrapGen
      }
    });

    // Monthly scrap sales
    if (i % 15 === 0 && i > 0) {
      const scrapSaleQty = 2.0;
      const scrapRev = scrapSaleQty * 780000; // Scrap sold @ ₹780/kg
      const scrapSale = await prisma.scrapInventory.create({
        data: {
          date: subDays(pDate, 1),
          type: "SOLD",
          qty: scrapSaleQty,
          revenue: scrapRev
        }
      });

      await prisma.paymentRecord.create({
        data: {
          date: subDays(pDate, 1),
          amount: scrapRev,
          type: "INCOMING",
          scrapSaleId: scrapSale.id,
          description: `Scrap Copper Sale (${scrapSaleQty} Tons)`
        }
      });
    }
  }
  console.log('✓ Added daily production logs across all brands & wire sizes');

  // 8. Sales Invoices & Customer Dispatches
  const salesList = [
    { daysAgo: 30, customer: customer1, qty: 8.0, rateKg: 875, brand: 'Poly Vansh', size: '1mm', isPaid: true },
    { daysAgo: 22, customer: customer2, qty: 5.0, rateKg: 885, brand: 'Poly Lifeline', size: '2mm', isPaid: true },
    { daysAgo: 15, customer: customer1, qty: 10.0, rateKg: 840, brand: 'Poly Unnati', size: '1mm', isPaid: true, saudaId: null },
    { daysAgo: 8,  customer: customer2, qty: 6.0, rateKg: 880, brand: 'Poly Life Plus', size: '2mm', isPaid: false },
    { daysAgo: 3,  customer: customer1, qty: 6.0, rateKg: 840, brand: 'Poly Unique Plus', size: '1mm', isPaid: false },
    { daysAgo: 1,  customer: customer1, qty: 4.0, rateKg: 875, brand: 'Poly Vansh', size: '2mm', isPaid: false }
  ];

  for (const s of salesList) {
    const sDate = subDays(today, s.daysAgo);
    const pricePerTon = s.rateKg * 1000;
    const totalVal = s.qty * pricePerTon;
    const amtPaid = s.isPaid ? totalVal : 0;

    const sale = await prisma.sale.create({
      data: {
        customerId: s.customer.id,
        date: sDate,
        totalValue: totalVal,
        amountPaid: amtPaid,
        fullyPaidDate: s.isPaid ? subDays(sDate, 2) : null,
        items: {
          create: [
            {
              productCategory: s.brand.includes('Life') ? 'Submersible Winding Wire' : 'CC Wires',
              brand: s.brand,
              wireType: s.size,
              qty: s.qty,
              pricePerTon,
              totalValue: totalVal,
              rawCopperCostAtSale: 842000
            }
          ]
        }
      }
    });

    await prisma.customerLedger.create({
      data: {
        customerId: s.customer.id,
        date: sDate,
        amount: totalVal,
        description: `Invoice: ${s.qty}T ${s.brand} ${s.size} @ ₹${s.rateKg}/kg`
      }
    });

    if (s.isPaid) {
      await prisma.customerLedger.create({
        data: {
          customerId: s.customer.id,
          date: subDays(sDate, 2),
          amount: -totalVal,
          description: `Payment received for Invoice ID: ${sale.id}`
        }
      });

      const pRec = await prisma.paymentRecord.create({
        data: {
          date: subDays(sDate, 2),
          amount: totalVal,
          type: "INCOMING",
          customerId: s.customer.id,
          description: `Customer Payment from ${s.customer.name}`
        }
      });

      await prisma.invoicePayment.create({
        data: {
          paymentRecordId: pRec.id,
          saleId: sale.id,
          amountApplied: totalVal
        }
      });
    }
  }
  console.log('✓ Added sales invoices and customer balances');

  // 9. Monthly Operating Expenses (Last 6 Months)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  for (let i = 0; i < 6; i++) {
    const eDate = subMonths(today, i);
    const monthName = `${months[eDate.getMonth()]} ${eDate.getFullYear()}`;

    await prisma.expense.create({ data: { date: eDate, category: 'Electricity', amount: 85000 + (i * 2000), expenseMonth: monthName, status: 'PAID' } });
    await prisma.expense.create({ data: { date: eDate, category: 'Factory Rent', amount: 65000, expenseMonth: monthName, status: 'PAID' } });
    await prisma.expense.create({ data: { date: eDate, category: 'Salaries', amount: 108000, expenseMonth: monthName, status: 'PAID' } });
    await prisma.expense.create({ data: { date: eDate, category: 'Maintenance & Dies', amount: 22000, expenseMonth: monthName, status: 'PAID' } });
  }
  console.log('✓ Added monthly plant operating expenses');

  // 10. Advances & Attendance
  const adv1 = await prisma.advance.create({ data: { employeeId: emp1.id, date: subDays(today, 15), amount: 5000, reason: 'Medical Checkup' } });
  const adv2 = await prisma.advance.create({ data: { employeeId: emp2.id, date: subDays(today, 25), amount: 10000, amountRepaid: 5000, reason: 'Festival Advance' } });

  await prisma.advanceRepayment.create({
    data: {
      advanceId: adv2.id,
      amount: 5000,
      date: subDays(today, 10)
    }
  });

  for (let i = 0; i < 30; i++) {
    const aDate = subDays(today, i);
    await prisma.attendance.create({ data: { employeeId: emp1.id, date: aDate, status: i % 7 === 0 ? 'Absent' : 'Present' } });
    await prisma.attendance.create({ data: { employeeId: emp2.id, date: aDate, status: i % 10 === 0 ? 'Half_day' : 'Present' } });
    await prisma.attendance.create({ data: { employeeId: emp3.id, date: aDate, status: "Present" } });
  }

  // 11. Reconcile FIFO Book & Recalculate Actual Stock Balances
  console.log('⚙️ Reconciling FIFO inventory and ledger books...');
  await reconcileFIFOBook(prisma);

  // 12. Update Customer / Supplier Outstanding Balances to match Ledger
  const allCust = await prisma.customer.findMany({ include: { ledgers: true } });
  for (const c of allCust) {
    const netBal = c.ledgers.reduce((acc, l) => acc + Number(l.amount), 0);
    await prisma.customer.update({ where: { id: c.id }, data: { creditBalance: netBal } });
  }

  const allSupp = await prisma.supplier.findMany({ include: { ledgers: true } });
  for (const s of allSupp) {
    const netBal = s.ledgers.reduce((acc, l) => acc + Number(l.amount), 0);
    await prisma.supplier.update({ where: { id: s.id }, data: { creditBalance: netBal } });
  }

  console.log('✨ Seed and balance synchronization completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });