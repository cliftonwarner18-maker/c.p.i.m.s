import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all work orders without order numbers
    const allWorkOrders = await base44.entities.WorkOrder.list('-created_date', 1000);
    const woWithoutNumbers = allWorkOrders.filter(wo => !wo.order_number);

    if (woWithoutNumbers.length === 0) {
      return Response.json({ message: 'No work orders need order numbers', updated: 0 });
    }

    // Get the highest existing order number to continue from
    const allWOsWithNumbers = allWorkOrders.filter(wo => wo.order_number);
    let maxNumber = 0;
    allWOsWithNumbers.forEach(wo => {
      const match = wo.order_number.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });

    // Generate and update order numbers
    let currentNum = maxNumber + 1;
    const updates = [];

    for (const wo of woWithoutNumbers) {
      const newOrderNumber = `WO-${String(currentNum).padStart(6, '0')}`;
      updates.push(
        base44.entities.WorkOrder.update(wo.id, { order_number: newOrderNumber })
      );
      currentNum++;
    }

    await Promise.all(updates);

    return Response.json({
      message: 'Successfully generated order numbers',
      updated: woWithoutNumbers.length,
      startingNumber: maxNumber + 1,
      endingNumber: currentNum - 1
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});