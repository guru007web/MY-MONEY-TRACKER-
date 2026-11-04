==========================================================================================
/* =========================================================
   WHERE DOES MY MONEY GO?
   FINAL COMPLETE JAVASCRIPT

   Includes:
   - Dashboard
   - Expenses
   - Income
   - Analytics support
   - LocalStorage
   - Add / Edit / Delete
   - Old expense deletion fix
   - Recent transactions
   - Dark mode
   - CSV export
   - JSON backup / restore
   - Offline / online status
   ========================================================= */


/* =========================================================
   1. STORAGE KEYS
   ========================================================= */

const EXPENSE_STORAGE_KEY = "expenses";
const INCOME_STORAGE_KEY = "income";


/* =========================================================
   2. STORAGE FUNCTIONS
   ========================================================= */

function getExpenses() {

    try {

        const data = localStorage.getItem(
            EXPENSE_STORAGE_KEY
        );

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );

        return [];

    }

}


function getIncomes() {

    try {

        const data = localStorage.getItem(
            INCOME_STORAGE_KEY
        );

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error loading income:",
            error
        );

        return [];

    }

}


function saveExpenses(expenses) {

    try {

        localStorage.setItem(
            EXPENSE_STORAGE_KEY,
            JSON.stringify(expenses)
        );

    } catch (error) {

        console.error(
            "Error saving expenses:",
            error
        );

        alert(
            "Could not save expenses."
        );

    }

}


function saveIncomes(incomes) {

    try {

        localStorage.setItem(
            INCOME_STORAGE_KEY,
            JSON.stringify(incomes)
        );

    } catch (error) {

        console.error(
            "Error saving income:",
            error
        );

        alert(
            "Could not save income."
        );

    }

}


/* =========================================================
   3. UNIQUE ID
   ========================================================= */

function generateID() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


/* =========================================================
   4. MONEY FORMAT
   ========================================================= */

function formatMoney(amount) {

    const number = Number(amount) || 0;

    return number.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   5. DATE FORMAT
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   6. ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   7. METADATA
   ========================================================= */

function createMetadata() {

    const now =
        new Date().toISOString();

    return {

        id: generateID(),

        createdAt: now,

        updatedAt: now,

        syncStatus: "pending"

    };

}


/* =========================================================
   8. EXPENSE MANAGEMENT
   ========================================================= */

function addExpense() {

    const amountElement =
        document.getElementById("amount");

    const categoryElement =
        document.getElementById("category");

    const dateElement =
        document.getElementById("date");

    const paymentElement =
        document.getElementById("payment");

    const descriptionElement =
        document.getElementById("description");


    if (
        !amountElement ||
        !categoryElement ||
        !dateElement ||
        !paymentElement ||
        !descriptionElement
    ) {

        return;

    }


    const amount =
        Number(amountElement.value);

    const category =
        categoryElement.value.trim();

    const date =
        dateElement.value;

    const payment =
        paymentElement.value.trim();

    const description =
        descriptionElement.value.trim();


    if (
        !amount ||
        amount <= 0 ||
        !category ||
        !date ||
        !payment ||
        !description
    ) {

        alert(
            "Please fill in all expense details correctly."
        );

        return;

    }


    const expense = {

        ...createMetadata(),

        amount: amount,

        category: category,

        date: date,

        payment: payment,

        description: description

    };


    const expenses =
        getExpenses();

    expenses.push(expense);

    saveExpenses(expenses);


    const form =
        document.getElementById(
            "expenseForm"
        );

    if (form) {
        form.reset();
    }


    setDefaultExpenseDate();

    refreshWebsite();

    alert(
        "Expense added successfully!"
    );

}


/* =========================================================
   IMPORTANT:
   DISPLAY EXPENSES

   We keep the ORIGINAL ARRAY INDEX while sorting.

   This fixes deletion of old expenses which may not
   contain proper IDs.
   ========================================================= */

function displayExpenses() {

    const tableBody =
        document.getElementById(
            "expenseTableBody"
        );

    if (!tableBody) {
        return;
    }


    const expenses =
        getExpenses();


    tableBody.innerHTML = "";


    if (expenses.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#94a3b8;
                    "
                >
                    No expenses recorded yet.
                </td>
            </tr>
        `;

        updateExpenseTotal();

        return;

    }


    /*
       Create objects containing:
       - expense
       - originalIndex

       The original index points directly to the
       LocalStorage array.
    */

    const indexedExpenses =
        expenses.map(
            (expense, index) => ({
                expense: expense,
                originalIndex: index
            })
        );


    /*
       Sort only the DISPLAY order.
       The originalIndex remains unchanged.
    */

    indexedExpenses.sort(
        (a, b) => {

            const dateA =
                new Date(
                    a.expense.date || 0
                ).getTime();

            const dateB =
                new Date(
                    b.expense.date || 0
                ).getTime();

            return dateB - dateA;

        }
    );


    indexedExpenses.forEach(
        function(item) {

            const expense =
                item.expense;

            const originalIndex =
                item.originalIndex;


            /*
               Old records may not have IDs.

               Give them one so they can also be
               edited normally in the future.
            */

            if (!expense.id) {

                expense.id =
                    generateID();

                expense.createdAt =
                    expense.createdAt ||
                    new Date().toISOString();

                expense.updatedAt =
                    new Date().toISOString();

                expense.syncStatus =
                    "pending";

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        expense.description
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        expense.category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        formatDate(
                            expense.date
                        )
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        expense.payment
                    )}
                </td>

                <td class="expense">
                    -${escapeHTML(
                        formatMoney(
                            expense.amount
                        )
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-button"
                        onclick="editExpenseByIndex(${originalIndex})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        onclick="deleteExpenseByIndex(${originalIndex})"
                    >
                        Delete
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    /*
       Save generated IDs for old records.
       This happens only if an old record was missing one.
    */

    saveExpenses(expenses);


    updateExpenseTotal();

}


/* =========================================================
   EXPENSE TOTAL
   ========================================================= */

function updateExpenseTotal() {

    const totalElement =
        document.getElementById(
            "totalExpenses"
        );

    if (!totalElement) {
        return;
    }


    const expenses =
        getExpenses();


    const total =
        expenses.reduce(
            function(sum, expense) {

                return (
                    sum +
                    Number(
                        expense.amount || 0
                    )
                );

            },
            0
        );


    totalElement.textContent =
        formatMoney(total);

}


/* =========================================================
   EDIT EXPENSE BY INDEX
   ========================================================= */

function editExpenseByIndex(index) {

    const expenses =
        getExpenses();

    const expense =
        expenses[index];


    if (!expense) {

        alert(
            "Expense not found."
        );

        return;

    }


    /*
       Make sure old records receive an ID.
    */

    if (!expense.id) {

        expense.id =
            generateID();

        expense.createdAt =
            expense.createdAt ||
            new Date().toISOString();

        expense.updatedAt =
            new Date().toISOString();

        expense.syncStatus =
            "pending";

        saveExpenses(expenses);

    }


    editExpense(
        expense.id
    );

}


/* =========================================================
   EDIT EXPENSE
   ========================================================= */

function editExpense(id) {

    const expenses =
        getExpenses();


    const expense =
        expenses.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!expense) {

        alert(
            "Expense not found."
        );

        return;

    }


    const newAmount =
        prompt(
            "Enter new amount:",
            expense.amount
        );


    if (newAmount === null) {
        return;
    }


    const amount =
        Number(newAmount);


    if (!amount || amount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    const newDescription =
        prompt(
            "Enter new description:",
            expense.description
        );


    if (newDescription === null) {
        return;
    }


    const newCategory =
        prompt(
            "Enter new category:",
            expense.category
        );


    if (newCategory === null) {
        return;
    }


    const newDate =
        prompt(
            "Enter new date (YYYY-MM-DD):",
            expense.date
        );


    if (newDate === null) {
        return;
    }


    const newPayment =
        prompt(
            "Enter payment method:",
            expense.payment
        );


    if (newPayment === null) {
        return;
    }


    expense.amount =
        amount;

    expense.description =
        newDescription.trim();

    expense.category =
        newCategory.trim();

    expense.date =
        newDate.trim();

    expense.payment =
        newPayment.trim();

    expense.updatedAt =
        new Date().toISOString();

    expense.syncStatus =
        "pending";


    saveExpenses(expenses);

    refreshWebsite();

    alert(
        "Expense updated successfully!"
    );

}


/* =========================================================
   DELETE EXPENSE BY INDEX
   THIS IS THE MAIN FIX
   ========================================================= */

function deleteExpenseByIndex(index) {

    const expenses =
        getExpenses();


    const expense =
        expenses[index];


    if (!expense) {

        alert(
            "Expense not found."
        );

        return;

    }


    const description =
        expense.description ||
        "this expense";


    const confirmed =
        confirm(
            `Delete "${description}"?`
        );


    if (!confirmed) {
        return;
    }


    /*
       Remove the EXACT item from the
       LocalStorage array.
    */

    expenses.splice(
        index,
        1
    );


    saveExpenses(
        expenses
    );


    refreshWebsite();


    alert(
        "Expense deleted successfully."
    );

}


/* =========================================================
   OLD ID-BASED DELETE FUNCTION
   Kept for compatibility.
   ========================================================= */

function deleteExpense(id) {

    const expenses =
        getExpenses();


    const index =
        expenses.findIndex(
            function(item) {

                return item.id === id;

            }
        );


    if (index === -1) {

        alert(
            "Expense not found."
        );

        return;

    }


    deleteExpenseByIndex(
        index
    );

}


/* =========================================================
   9. INCOME MANAGEMENT
   ========================================================= */

function addIncome() {

    const amountElement =
        document.getElementById(
            "incomeAmount"
        );

    const categoryElement =
        document.getElementById(
            "incomeCategory"
        );

    const dateElement =
        document.getElementById(
            "incomeDate"
        );

    const descriptionElement =
        document.getElementById(
            "incomeDescription"
        );


    if (
        !amountElement ||
        !categoryElement ||
        !dateElement ||
        !descriptionElement
    ) {

        return;

    }


    const amount =
        Number(amountElement.value);

    const category =
        categoryElement.value.trim();

    const date =
        dateElement.value;

    const description =
        descriptionElement.value.trim();


    if (
        !amount ||
        amount <= 0 ||
        !category ||
        !date ||
        !description
    ) {

        alert(
            "Please fill in all income details correctly."
        );

        return;

    }


    const income = {

        ...createMetadata(),

        amount: amount,

        category: category,

        date: date,

        description: description

    };


    const incomes =
        getIncomes();

    incomes.push(income);

    saveIncomes(incomes);


    const form =
        document.getElementById(
            "incomeForm"
        );

    if (form) {
        form.reset();
    }


    setDefaultIncomeDate();

    refreshWebsite();

    alert(
        "Income added successfully!"
    );

}


/* =========================================================
   DISPLAY INCOME
   ========================================================= */

function displayIncome() {

    const tableBody =
        document.getElementById(
            "incomeTableBody"
        );

    if (!tableBody) {
        return;
    }


    const incomes =
        getIncomes();


    tableBody.innerHTML = "";


    if (incomes.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#94a3b8;
                    "
                >
                    No income recorded yet.
                </td>
            </tr>
        `;

        updateIncomeTotal();

        return;

    }


    incomes
        .slice()
        .sort(
            function(a, b) {

                return (
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
                );

            }
        )
        .forEach(
            function(income) {

                /*
                   Give old income records IDs.
                */

                if (!income.id) {

                    income.id =
                        generateID();

                    income.createdAt =
                        income.createdAt ||
                        new Date().toISOString();

                    income.updatedAt =
                        new Date().toISOString();

                    income.syncStatus =
                        "pending";

                }


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            income.description
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            income.category
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatDate(
                                income.date
                            )
                        )}
                    </td>

                    <td class="income">
                        +${escapeHTML(
                            formatMoney(
                                income.amount
                            )
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="edit-button"
                            onclick="editIncome('${income.id}')"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            onclick="deleteIncome('${income.id}')"
                        >
                            Delete
                        </button>

                    </td>

                `;


                tableBody.appendChild(row);

            }
        );


    saveIncomes(incomes);

    updateIncomeTotal();

}


/* =========================================================
   INCOME TOTAL
   ========================================================= */

function updateIncomeTotal() {

    const totalElement =
        document.getElementById(
            "totalIncome"
        );

    if (!totalElement) {
        return;
    }


    const incomes =
        getIncomes();


    const total =
        incomes.reduce(
            function(sum, income) {

                return (
                    sum +
                    Number(
                        income.amount || 0
                    )
                );

            },
            0
        );


    totalElement.textContent =
        formatMoney(total);

}


/* =========================================================
   EDIT INCOME
   ========================================================= */

function editIncome(id) {

    const incomes =
        getIncomes();


    const income =
        incomes.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!income) {

        alert(
            "Income record not found."
        );

        return;

    }


    const newAmount =
        prompt(
            "Enter new amount:",
            income.amount
        );


    if (newAmount === null) {
        return;
    }


    const amount =
        Number(newAmount);


    if (!amount || amount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    const newDescription =
        prompt(
            "Enter new description:",
            income.description
        );


    if (newDescription === null) {
        return;
    }


    const newCategory =
        prompt(
            "Enter new category:",
            income.category
        );


    if (newCategory === null) {
        return;
    }


    const newDate =
        prompt(
            "Enter new date (YYYY-MM-DD):",
            income.date
        );


    if (newDate === null) {
        return;
    }


    income.amount =
        amount;

    income.description =
        newDescription.trim();

    income.category =
        newCategory.trim();

    income.date =
        newDate.trim();

    income.updatedAt =
        new Date().toISOString();

    income.syncStatus =
        "pending";


    saveIncomes(incomes);

    refreshWebsite();

    alert(
        "Income updated successfully!"
    );

}


/* =========================================================
   DELETE INCOME
   ========================================================= */

function deleteIncome(id) {

    const incomes =
        getIncomes();


    const index =
        incomes.findIndex(
            function(item) {

                return item.id === id;

            }
        );


    if (index === -1) {

        alert(
            "Income record not found."
        );

        return;

    }


    const income =
        incomes[index];


    const confirmed =
        confirm(
            `Delete "${income.description}"?`
        );


    if (!confirmed) {
        return;
    }


    incomes.splice(
        index,
        1
    );


    saveIncomes(
        incomes
    );


    refreshWebsite();


    alert(
        "Income deleted successfully."
    );

}


/* =========================================================
   10. DASHBOARD
   ========================================================= */

function updateDashboard() {

    const incomeElement =
        document.getElementById(
            "dashboardIncome"
        );

    const expenseElement =
        document.getElementById(
            "dashboardExpenses"
        );

    const balanceElement =
        document.getElementById(
            "dashboardBalance"
        );

    const savingsElement =
        document.getElementById(
            "dashboardSavings"
        );


    if (
        !incomeElement &&
        !expenseElement &&
        !balanceElement &&
        !savingsElement
    ) {

        return;

    }


    const incomes =
        getIncomes();

    const expenses =
        getExpenses();


    const totalIncome =
        incomes.reduce(
            function(sum, income) {

                return (
                    sum +
                    Number(
                        income.amount || 0
                    )
                );

            },
            0
        );


    const totalExpenses =
        expenses.reduce(
            function(sum, expense) {

                return (
                    sum +
                    Number(
                        expense.amount || 0
                    )
                );

            },
            0
        );


    const balance =
        totalIncome -
        totalExpenses;


    let savingsRate = 0;


    if (totalIncome > 0) {

        savingsRate =
            (
                balance /
                totalIncome
            ) * 100;

    }


    if (incomeElement) {

        incomeElement.textContent =
            formatMoney(
                totalIncome
            );

    }


    if (expenseElement) {

        expenseElement.textContent =
            formatMoney(
                totalExpenses
            );

    }


    if (balanceElement) {

        balanceElement.textContent =
            formatMoney(
                balance
            );

        balanceElement.style.color =
            balance >= 0
                ? ""
                : "#dc2626";

    }


    if (savingsElement) {

        savingsElement.textContent =
            `${savingsRate.toFixed(1)}%`;

    }

}


/* =========================================================
   11. RECENT TRANSACTIONS
   ========================================================= */

function displayRecentTransactions() {

    const tableBody =
        document.getElementById(
            "recentTransactions"
        );


    if (!tableBody) {
        return;
    }


    const expenses =
        getExpenses();

    const incomes =
        getIncomes();


    const transactions = [];


    expenses.forEach(
        function(expense) {

            transactions.push({

                type: "expense",

                description:
                    expense.description,

                category:
                    expense.category,

                date:
                    expense.date,

                amount:
                    Number(
                        expense.amount || 0
                    ),

                id:
                    expense.id

            });

        }
    );


    incomes.forEach(
        function(income) {

            transactions.push({

                type: "income",

                description:
                    income.description,

                category:
                    income.category,

                date:
                    income.date,

                amount:
                    Number(
                        income.amount || 0
                    ),

                id:
                    income.id

            });

        }
    );


    transactions.sort(
        function(a, b) {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        }
    );


    const recent =
        transactions.slice(
            0,
            8
        );


    tableBody.innerHTML = "";


    if (recent.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#94a3b8;
                    "
                >
                    No transactions yet.
                </td>
            </tr>
        `;

        return;

    }


    recent.forEach(
        function(transaction) {

            const row =
                document.createElement("tr");


            const amountClass =
                transaction.type === "income"
                    ? "income"
                    : "expense";


            const sign =
                transaction.type === "income"
                    ? "+"
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        transaction.description
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        transaction.category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        formatDate(
                            transaction.date
                        )
                    )}
                </td>

                <td class="${amountClass}">
                    ${sign}${escapeHTML(
                        formatMoney(
                            transaction.amount
                        )
                    )}
                </td>

            `;


            tableBody.appendChild(row);

        }
    );

}


/* =========================================================
   12. DEFAULT DATES
   ========================================================= */

function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function setDefaultExpenseDate() {

    const dateElement =
        document.getElementById(
            "date"
        );


    if (
        dateElement &&
        !dateElement.value
    ) {

        dateElement.value =
            getTodayDate();

    }

}


function setDefaultIncomeDate() {

    const dateElement =
        document.getElementById(
            "incomeDate"
        );


    if (
        dateElement &&
        !dateElement.value
    ) {

        dateElement.value =
            getTodayDate();

    }

}


/* =========================================================
   13. DARK MODE
   ========================================================= */

function initializeDarkMode() {

    const darkModeToggle =
        document.getElementById(
            "darkModeToggle"
        );

    // Access to localStorage can be denied for some local-file/browser settings.
    // Never let that prevent the forms and other controls from initializing.
    let savedMode = null;
    try {
        savedMode = window.localStorage.getItem("darkMode");
    } catch (error) {
        console.warn("Dark-mode preference could not be read; using light mode.", error);
    }


    if (
        savedMode === "enabled"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateDarkModeButton();


    if (!darkModeToggle) {
        return;
    }


    /*
       Prevent duplicate listeners.
    */

    if (
        darkModeToggle.dataset
            .darkModeInitialized === "true"
    ) {

        return;

    }


    darkModeToggle.dataset
        .darkModeInitialized = "true";


    darkModeToggle.addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "dark-mode"
            );


            const enabled =
                document.body.classList.contains(
                    "dark-mode"
                );


            try {
                window.localStorage.setItem(
                    "darkMode",
                    enabled ? "enabled" : "disabled"
                );
            } catch (error) {
                // The visual toggle still works even if preferences cannot be saved.
                console.warn("Dark-mode preference could not be saved.", error);
            }

            updateDarkModeButton();

        }
    );

}


function updateDarkModeButton() {

    const button =
        document.getElementById(
            "darkModeToggle"
        );


    if (!button) {
        return;
    }


    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        button.innerHTML =
            "☀️ Light Mode";

    } else {

        button.innerHTML =
            "🌙 Dark Mode";

    }

}


/* =========================================================
   14. CSV FUNCTIONS
   ========================================================= */

function convertToCSV(data) {

    if (!data.length) {
        return "";
    }


    const headers =
        Object.keys(
            data[0]
        );


    const rows =
        data.map(
            function(item) {

                return headers
                    .map(
                        function(header) {

                            const value =
                                item[header] ??
                                "";

                            const text =
                                String(value)
                                    .replace(
                                        /"/g,
                                        '""'
                                    );

                            return `"${text}"`;

                        }
                    )
                    .join(",");

            }
        );


    return [
        headers.join(","),
        ...rows
    ].join("\n");

}


function downloadFile(
    content,
    filename,
    type
) {

    const blob =
        new Blob(
            [content],
            {
                type: type
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


function exportExpensesCSV() {

    const expenses =
        getExpenses();


    if (expenses.length === 0) {

        alert(
            "There are no expenses to export."
        );

        return;

    }


    const csvData =
        expenses.map(
            function(expense) {

                return {

                    Description:
                        expense.description,

                    Category:
                        expense.category,

                    Date:
                        expense.date,

                    Payment:
                        expense.payment,

                    Amount:
                        expense.amount

                };

            }
        );


    const csv =
        convertToCSV(
            csvData
        );


    downloadFile(
        csv,
        "expenses.csv",
        "text/csv;charset=utf-8;"
    );

}


function exportIncomeCSV() {

    const incomes =
        getIncomes();


    if (incomes.length === 0) {

        alert(
            "There is no income to export."
        );

        return;

    }


    const csvData =
        incomes.map(
            function(income) {

                return {

                    Description:
                        income.description,

                    Category:
                        income.category,

                    Date:
                        income.date,

                    Amount:
                        income.amount

                };

            }
        );


    const csv =
        convertToCSV(
            csvData
        );


    downloadFile(
        csv,
        "income.csv",
        "text/csv;charset=utf-8;"
    );

}


function exportAllCSV() {

    const expenses =
        getExpenses();

    const incomes =
        getIncomes();


    const allTransactions = [];


    expenses.forEach(
        function(expense) {

            allTransactions.push({

                Type: "Expense",

                Description:
                    expense.description,

                Category:
                    expense.category,

                Date:
                    expense.date,

                Payment:
                    expense.payment,

                Amount:
                    expense.amount

            });

        }
    );


    incomes.forEach(
        function(income) {

            allTransactions.push({

                Type: "Income",

                Description:
                    income.description,

                Category:
                    income.category,

                Date:
                    income.date,

                Payment: "",

                Amount:
                    income.amount

            });

        }
    );


    if (
        allTransactions.length === 0
    ) {

        alert(
            "There are no transactions to export."
        );

        return;

    }


    const csv =
        convertToCSV(
            allTransactions
        );


    downloadFile(
        csv,
        "money-tracker-transactions.csv",
        "text/csv;charset=utf-8;"
    );

}


/* =========================================================
   15. JSON BACKUP
   ========================================================= */

function backupData() {

    const backup = {

        appName:
            "Where Does My Money Go?",

        version:
            "1.0",

        exportedAt:
            new Date().toISOString(),

        expenses:
            getExpenses(),

        income:
            getIncomes()

    };


    const json =
        JSON.stringify(
            backup,
            null,
            4
        );


    downloadFile(
        json,
        "money-tracker-backup.json",
        "application/json"
    );

}


/* =========================================================
   16. JSON RESTORE
   ========================================================= */

function restoreDataFromFile(file) {

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            try {

                const backup =
                    JSON.parse(
                        event.target.result
                    );


                if (
                    !backup ||
                    typeof backup !== "object"
                ) {

                    throw new Error(
                        "Invalid backup file."
                    );

                }


                const expenses =
                    Array.isArray(
                        backup.expenses
                    )
                        ? backup.expenses
                        : [];


                const income =
                    Array.isArray(
                        backup.income
                    )
                        ? backup.income
                        : [];


                const confirmed =
                    confirm(
                        "Restoring this backup will replace your current expenses and income. Continue?"
                    );


                if (!confirmed) {
                    return;
                }


                saveExpenses(
                    expenses
                );

                saveIncomes(
                    income
                );


                refreshWebsite();


                alert(
                    "Backup restored successfully!"
                );


            } catch (error) {

                console.error(
                    "Restore error:",
                    error
                );


                alert(
                    "Invalid JSON backup file."
                );

            }

        };


    reader.readAsText(
        file
    );

}


function openRestoreFilePicker() {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.accept =
        ".json,application/json";


    input.addEventListener(
        "change",
        function() {

            const file =
                input.files[0];


            if (file) {

                restoreDataFromFile(
                    file
                );

            }

        }
    );


    input.click();

}


/* =========================================================
   17. ONLINE / OFFLINE
   ========================================================= */

function updateConnectionStatus() {

    if (navigator.onLine) {

        console.log(
            "You are online."
        );

    } else {

        console.log(
            "You are offline. Transactions will continue to be stored locally."
        );

    }

}


window.addEventListener(
    "online",
    function() {

        updateConnectionStatus();

    }
);


window.addEventListener(
    "offline",
    function() {

        updateConnectionStatus();

    }
);


/* =========================================================
   18. REFRESH WEBSITE
   ========================================================= */

function refreshWebsite() {

    try {
        displayExpenses();
    } catch (error) {
        console.error(
            "Expense display error:",
            error
        );
    }


    try {
        displayIncome();
    } catch (error) {
        console.error(
            "Income display error:",
            error
        );
    }


    try {
        updateExpenseTotal();
    } catch (error) {
        console.error(
            "Expense total error:",
            error
        );
    }


    try {
        updateIncomeTotal();
    } catch (error) {
        console.error(
            "Income total error:",
            error
        );
    }


    try {
        updateDashboard();
    } catch (error) {
        console.error(
            "Dashboard error:",
            error
        );
    }


    try {
        displayRecentTransactions();
    } catch (error) {
        console.error(
            "Recent transactions error:",
            error
        );
    }


    /*
       Analytics page has its own updateCharts()
       function.
    */

    if (
        typeof updateCharts ===
        "function"
    ) {

        try {

            updateCharts();

        } catch (error) {

            console.error(
                "Analytics update error:",
                error
            );

        }

    }

}


/* =========================================================
   19. FORM EVENT HANDLERS
   ========================================================= */

function initializeForms() {

    const expenseForm =
        document.getElementById(
            "expenseForm"
        );


    if (
        expenseForm &&
        expenseForm.dataset
            .initialized !== "true"
    ) {

        expenseForm.dataset
            .initialized = "true";


        expenseForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                addExpense();

            }
        );

    }


    const incomeForm =
        document.getElementById(
            "incomeForm"
        );


    if (
        incomeForm &&
        incomeForm.dataset
            .initialized !== "true"
    ) {

        incomeForm.dataset
            .initialized = "true";


        incomeForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                addIncome();

            }
        );

    }

}


/* =========================================================
   20. STORAGE CHANGE
   ========================================================= */

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key ===
                EXPENSE_STORAGE_KEY ||
            event.key ===
                INCOME_STORAGE_KEY
        ) {

            refreshWebsite();

        }


        if (
            event.key ===
            "darkMode"
        ) {

            let enabled = false;
            try {
                enabled = window.localStorage.getItem("darkMode") === "enabled";
            } catch (error) {
                console.warn("Dark-mode preference could not be read.", error);
            }


            document.body.classList.toggle(
                "dark-mode",
                enabled
            );


            updateDarkModeButton();

        }

    }
);


/* =========================================================
   21. INITIALIZE WEBSITE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {
        // Initialize each feature independently so one failure cannot disable
        // every form/button on the page.
        const initializers = [
            initializeDarkMode,
            initializeForms,
            setDefaultExpenseDate,
            setDefaultIncomeDate,
            refreshWebsite,
            updateConnectionStatus
        ];
        initializers.forEach(function(initialize) {
            try {
                initialize();
            } catch (error) {
                console.error("Website feature failed to initialize: " + initialize.name, error);
            }
        });
    }
);


/* =========================================================
   22. GLOBAL FUNCTIONS
   ========================================================= */

window.addExpense =
    addExpense;

window.addIncome =
    addIncome;

window.editExpense =
    editExpense;

window.editExpenseByIndex =
    editExpenseByIndex;

window.deleteExpense =
    deleteExpense;

window.deleteExpenseByIndex =
    deleteExpenseByIndex;

window.editIncome =
    editIncome;

window.deleteIncome =
    deleteIncome;

window.exportExpensesCSV =
    exportExpensesCSV;

window.exportIncomeCSV =
    exportIncomeCSV;

window.exportAllCSV =
    exportAllCSV;

window.backupData =
    backupData;

window.restoreDataFromFile =
    restoreDataFromFile;

window.openRestoreFilePicker =
    openRestoreFilePicker;

window.refreshWebsite =
    refreshWebsite;


/* =========================================================
   ANALYTICS CHARTS AND BREAKDOWN - COMPLETE FIX
   ========================================================= */

let expenseCategoryChartInstance = null;
let incomeCategoryChartInstance = null;
let incomeExpenseChartInstance = null;
let monthlyTrendChartInstance = null;


/* =========================================================
   GROUP TRANSACTIONS BY CATEGORY
   ========================================================= */

function groupByCategory(records) {
    const totals = {};

    records.forEach(function (record) {
        const category =
            String(record.category || "Other").trim() || "Other";

        const amount = Number(record.amount) || 0;

        totals[category] = (totals[category] || 0) + amount;
    });

    return {
        labels: Object.keys(totals),
        values: Object.values(totals)
    };
}


/* =========================================================
   FIND BREAKDOWN CONTAINER
   ========================================================= */

function findBreakdownContainer(type) {
    const possibleIds = type === "expense"
        ? [
            "expenseBreakdown",
            "expenseBreakdownList",
            "expenseCategoryBreakdown",
            "expenseBreakdownContainer"
        ]
        : [
            "incomeBreakdown",
            "incomeBreakdownList",
            "incomeCategoryBreakdown",
            "incomeBreakdownContainer"
        ];

    for (const id of possibleIds) {
        const element = document.getElementById(id);

        if (element) {
            return element;
        }
    }

    // Fallback: locate the breakdown using its heading.
    const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4")
    );

    const heading = headings.find(function (element) {
        const text = element.textContent.toLowerCase();

        return type === "expense"
            ? text.includes("expense") && text.includes("breakdown")
            : text.includes("income") && text.includes("breakdown");
    });

    if (heading) {
        const section = heading.closest(
            ".dashboard-section, .transactions, section, .form-container"
        );

        if (section) {
            return section.querySelector(".breakdown-list") || section;
        }

        let next = heading.nextElementSibling;

        while (next) {
            if (next.classList.contains("breakdown-list")) {
                return next;
            }

            const list = next.querySelector?.(".breakdown-list");

            if (list) {
                return list;
            }

            next = next.nextElementSibling;
        }
    }

    // Fallback for pages with two generic breakdown lists.
    const lists = document.querySelectorAll(".breakdown-list");

    if (lists.length >= 2) {
        return type === "expense" ? lists[0] : lists[1];
    }

    return null;
}


/* =========================================================
   DISPLAY INCOME / EXPENSE CATEGORY BREAKDOWN
   ========================================================= */

function displayCategoryBreakdown(type, records) {
    const container = findBreakdownContainer(type);

    if (!container) {
        console.warn(
            type + " breakdown container was not found. Check its HTML ID."
        );
        return;
    }

    const totals = groupByCategory(records);

    container.innerHTML = "";

    if (totals.labels.length === 0) {
        container.innerHTML = `
            <p class="progress-text">
                No ${type} records available yet.
            </p>
        `;
        return;
    }

    const grandTotal = totals.values.reduce(
        (sum, amount) => sum + amount,
        0
    );

    totals.labels.forEach(function (category, index) {
        const amount = totals.values[index];

        const percentage = grandTotal > 0
            ? (amount / grandTotal) * 100
            : 0;

        const item = document.createElement("div");
        item.className = "breakdown-item";

        const details = document.createElement("div");

        const categoryName = document.createElement("div");
        categoryName.className = "breakdown-category";
        categoryName.textContent = category;

        const percentageText = document.createElement("small");
        percentageText.textContent = percentage.toFixed(1) + "% of total";
        percentageText.style.color = "#64748b";

        details.appendChild(categoryName);
        details.appendChild(percentageText);

        const amountElement = document.createElement("div");
        amountElement.className = "breakdown-amount";
        amountElement.textContent = formatMoney(amount);

        item.appendChild(details);
        item.appendChild(amountElement);

        container.appendChild(item);
    });
}


/* =========================================================
   PREPARE MONTHLY DATA
   ========================================================= */

function getMonthlyData(expenses, incomes) {
    const monthlyTotals = {};

    function addRecords(records, type) {
        records.forEach(function (record) {
            if (!record.date) {
                return;
            }

            const date = new Date(record.date + "T00:00:00");

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0");

            if (!monthlyTotals[key]) {
                monthlyTotals[key] = {
                    income: 0,
                    expenses: 0
                };
            }

            monthlyTotals[key][type] += Number(record.amount) || 0;
        });
    }

    addRecords(incomes, "income");
    addRecords(expenses, "expenses");

    const keys = Object.keys(monthlyTotals).sort();

    return {
        labels: keys.map(function (key) {
            const parts = key.split("-");
            const date = new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                1
            );

            return date.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric"
            });
        }),

        income: keys.map(key => monthlyTotals[key].income),
        expenses: keys.map(key => monthlyTotals[key].expenses)
    };
}


/* =========================================================
   DESTROY OLD CHART SAFELY
   ========================================================= */

function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}


/* =========================================================
   UPDATE ALL ANALYTICS
   ========================================================= */

function updateCharts() {
    const expenseCanvas =
        document.getElementById("expenseCategoryChart");

    const incomeCanvas =
        document.getElementById("incomeCategoryChart");

    const comparisonCanvas =
        document.getElementById("incomeExpenseChart");

    const monthlyCanvas =
        document.getElementById("monthlyTrendChart");

    const expenses = getExpenses();
    const incomes = getIncomes();

    // Update the category breakdown lists even if Chart.js is unavailable.
    displayCategoryBreakdown("expense", expenses);
    displayCategoryBreakdown("income", incomes);

    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js is not loaded. Check the Chart.js script in analytics.html."
        );
        return;
    }

    const expenseData = groupByCategory(expenses);
    const incomeData = groupByCategory(incomes);

    const colors = [
        "#6366f1",
        "#f59e0b",
        "#10b981",
        "#ef4444",
        "#06b6d4",
        "#8b5cf6",
        "#ec4899",
        "#84cc16",
        "#f97316",
        "#14b8a6"
    ];

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false
    };


    /* -------------------------
       EXPENSE PIE CHART
       ------------------------- */

    if (expenseCanvas) {
        destroyChart(expenseCategoryChartInstance);

        expenseCategoryChartInstance = new Chart(expenseCanvas, {
            type: "pie",

            data: {
                labels: expenseData.labels.length
                    ? expenseData.labels
                    : ["No expenses yet"],

                datasets: [{
                    data: expenseData.values.length
                        ? expenseData.values
                        : [1],

                    backgroundColor: colors,
                    borderWidth: 2
                }]
            },

            options: {
                ...chartOptions,

                plugins: {
                    legend: {
                        position: "bottom"
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (!expenseData.values.length) {
                                    return "No expenses recorded";
                                }

                                return context.label + ": " +
                                    formatMoney(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }


    /* -------------------------
       INCOME PIE CHART
       ------------------------- */

    if (incomeCanvas) {
        destroyChart(incomeCategoryChartInstance);

        incomeCategoryChartInstance = new Chart(incomeCanvas, {
            type: "pie",

            data: {
                labels: incomeData.labels.length
                    ? incomeData.labels
                    : ["No income yet"],

                datasets: [{
                    data: incomeData.values.length
                        ? incomeData.values
                        : [1],

                    backgroundColor: colors,
                    borderWidth: 2
                }]
            },

            options: {
                ...chartOptions,

                plugins: {
                    legend: {
                        position: "bottom"
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (!incomeData.values.length) {
                                    return "No income recorded";
                                }

                                return context.label + ": " +
                                    formatMoney(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }


    /* -------------------------
       INCOME VS EXPENSE CHART
       ------------------------- */

    if (comparisonCanvas) {
        destroyChart(incomeExpenseChartInstance);

        const totalIncome = incomes.reduce(
            (sum, item) => sum + (Number(item.amount) || 0),
            0
        );

        const totalExpenses = expenses.reduce(
            (sum, item) => sum + (Number(item.amount) || 0),
            0
        );

        incomeExpenseChartInstance = new Chart(comparisonCanvas, {
            type: "bar",

            data: {
                labels: ["Total Income", "Total Expenses"],

                datasets: [{
                    label: "Amount (₹)",
                    data: [totalIncome, totalExpenses],

                    backgroundColor: ["#10b981", "#ef4444"],
                    borderRadius: 8
                }]
            },

            options: {
                ...chartOptions,

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: function (value) {
                                return "₹" +
                                    Number(value).toLocaleString("en-IN");
                            }
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatMoney(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }


    /* -------------------------
       MONTHLY FINANCIAL TREND
       ------------------------- */

    if (monthlyCanvas) {
        destroyChart(monthlyTrendChartInstance);

        const monthlyData = getMonthlyData(expenses, incomes);

        monthlyTrendChartInstance = new Chart(monthlyCanvas, {
            type: "line",

            data: {
                labels: monthlyData.labels.length
                    ? monthlyData.labels
                    : ["No transactions yet"],

                datasets: [
                    {
                        label: "Income",

                        data: monthlyData.income.length
                            ? monthlyData.income
                            : [0],

                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        borderWidth: 3,
                        tension: 0.3,
                        fill: false
                    },

                    {
                        label: "Expenses",

                        data: monthlyData.expenses.length
                            ? monthlyData.expenses
                            : [0],

                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        borderWidth: 3,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },

            options: {
                ...chartOptions,

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: function (value) {
                                return "₹" +
                                    Number(value).toLocaleString("en-IN");
                            }
                        }
                    }
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ": " +
                                    formatMoney(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
}


/* =========================================================
   INITIALIZE ANALYTICS WHEN PAGE LOADS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    updateCharts();
});


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.updateCharts = updateCharts;
window.displayCategoryBreakdown = displayCategoryBreakdown;


/* =========================================================
   END OF ANALYTICS CODE
   ========================================================= */

   
function updateMoneyLeakDetector() {
    const summary = document.getElementById("moneyLeakSummary");
    const results = document.getElementById("moneyLeakResults");
    const legacyContainer = document.getElementById("moneyLeakDetector");
    if (!summary && !results && !legacyContainer) return;

    let expenses = [];
    try {
        const stored = JSON.parse(localStorage.getItem(EXPENSE_STORAGE_KEY) || "[]");
        expenses = Array.isArray(stored) ? stored : [];
    } catch (error) {
        console.error("Could not read saved expenses:", error);
    }

    const clear = element => { if (element) element.replaceChildren(); };
    clear(summary);
    clear(results);
    clear(legacyContainer);

    if (!expenses.length) {
        const isLocalFile = window.location.protocol === "file:";
        const message = isLocalFile
            ? "No expenses are visible here. Open the project using START_WEBSITE.bat so all pages use the same saved data. If you already entered expenses in the older file:// version, export a JSON backup from its Dashboard, then restore that backup in the new Dashboard."
            : "No expenses are saved in this copy yet. Open Expenses and add an expense, or if you entered expenses in an older copy, use Dashboard → Backup Data there and Dashboard → Restore Backup here. Then return to this page.";
        if (summary) summary.textContent = message;
        else if (legacyContainer) legacyContainer.textContent = message;
        return;
    }

    const totals = {};
    let grandTotal = 0;
    expenses.forEach(expense => {
        const category = String(expense.category || "Other");
        const amount = Number(expense.amount) || 0;
        if (amount < 0) return;
        totals[category] = (totals[category] || 0) + amount;
        grandTotal += amount;
    });

    if (summary) {
        const total = document.createElement("h2");
        total.textContent = "Total expenses: ₹" + grandTotal.toFixed(2);
        summary.appendChild(total);
        const note = document.createElement("p");
        note.textContent = "Your highest-spending categories are listed below.";
        summary.appendChild(note);
    }

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const target = results || legacyContainer;
    if (!target) return;

    sorted.slice(0, 3).forEach(([category, amount], index) => {
        const percentage = grandTotal ? (amount / grandTotal * 100) : 0;
        const card = document.createElement("article");
        card.className = "money-leak-card";
        const heading = document.createElement("h3");
        heading.textContent = (index + 1) + ". " + category;
        const amountText = document.createElement("p");
        amountText.textContent = "₹" + amount.toFixed(2) + " · " + percentage.toFixed(1) + "% of spending";
        const track = document.createElement("div");
        track.className = "money-leak-bar";
        const fill = document.createElement("div");
        fill.className = "money-leak-bar-fill";
        fill.style.width = Math.max(0, Math.min(100, percentage)) + "%";
        track.appendChild(fill);
        card.append(heading, amountText, track);
        target.appendChild(card);
    });

    if (sorted.length === 0) {
        target.textContent = "No valid expense amounts found.";
    }
}

window.updateMoneyLeakDetector = updateMoneyLeakDetector;
document.addEventListener("DOMContentLoaded", updateMoneyLeakDetector);