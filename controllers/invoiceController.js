const Invoice = require("../models/Invoice");

//@desc   Create a Invoice 
//@route  POST /api/invoices
//@access Private

exports.createInvoice = async (req, res) => {
    try {
        const user = req.user.id;
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
        } = req.body;

        // Subtotal calculation
        let subtotal = 0;
        let taxTotal = 0;
        items.forEach((item) => {
            subtotal += item.unitPrice * item.quantity;
            taxTotal += ((item.unitPrice * item.quantity) * (item.taxPercent || 0)) / 100;
        });

        const total = subtotal + taxTotal;

        const invoice = new Invoice({
            user,
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
            subtotal,
            taxTotal,
            total,
        });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500)
            .json({ message: "Error creating invoice", error: error.message });

    }
};

//@desc   Get all invoices of logged-in user 
//@route  GET /api/invoices
//@access Private

exports.getInvoices = async (req, res) => {
    try {
        const invoice = await Invoice.find().populate("user", "name email");
        res.json(invoice);
    } catch (error) { 
        res.status(500)
            .json({ message: "Error Fetching invoice", error: error.message });
    }
}

//@desc   Get single Invoice By Id
//@route  GET /api/invoices/:id
//@access Private

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate("user", "name email");
        if (!invoice) return res.status(404).json({ message: "Invoice not Found" });
        // check if the invoice belongs to the user
        if (invoice.user._id.toString() !== req.user.id){
            return res.status(401).json({ message:" Not authorized"});
        }
        
        res.json(invoice);
    } catch (error) {
        res.status(500)
            .json({ message: "Error Fetching invoice", error: error.message });
    }
}

//@desc   Update Invoice
//@route  PUT /api/invoices/:id
//@access Private

exports.updateInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billForm,
            billTo,
            items,
            notes,
            paymentTerms,
            status,
        } = req.body;

        // recalculate totals if items changed
        let subtotal = 0;
        let taxTotal = 0;
        if (items && items.length > 0) {
            items.forEach((item) => {
                subtotal += item.unitPrice * item.quantity;
                taxTotal += ((item.unitPrice * item.quantity) * (item.taxPercent || 0)) / 100;
            });
        }
        const total = subtotal * taxTotal;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            {
                invoiceNumber,
                invoiceDate,
                dueDate,
                billForm,
                billTo,
                items,
                notes,
                paymentTerms,
                status,
                subtotal,
                taxTotal,
                total,
            },
            { new: true }
        );
        if (!updatedInvoice) return res.status(404).json({ message: "Invoice not found" });
        res.json(updatedInvoice)
    } catch (error) {
        res.status(500)
            .json({ message: "Error Updating invoice", error: error.message });
    }
}

//@desc   Delete Invoice
//@route  Delete /api/invoices/:id
//@access Private

exports.deleteInvoice = async (req, res) => {
    try {
     const invoice = await Invoice.findByIdAndDelete(req.params.id);
     if(!invoice) return res.status(404).json({message:"Invoice not found"});
     res.json({message: "Invoice deleted Succesfully"});
    } catch (error) {
        res.status(500)
            .json({ message: "Error Deleting invoice", error: error.message });
    }
}