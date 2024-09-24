// Mendapatkan elemen-elemen penting dari DOM
const form = document.getElementById('form');
const description = document.getElementById('description');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const balance = document.getElementById('balance');
const incomeDisplay = document.getElementById('income');
const expenseDisplay = document.getElementById('expense');
const downloadCSVBtn = document.getElementById('download-csv-btn');
const downloadXLSXBtn = document.getElementById('download-xlsx-btn');

// Mendapatkan transaksi dari Local Storage atau inisialisasi array kosong
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Fungsi untuk menghasilkan ID unik
function generateID() {
    // Pilih salah satu opsi di bawah ini

    // Opsi A: Menggunakan Timestamp
    // return Date.now();

    // Opsi B: Kombinasi Timestamp dan Angka Acak
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Opsi C: UUID Sederhana
    // return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    //     const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    //     return v.toString(16);
    // });
}

// Fungsi untuk menampilkan transaksi di daftar
function displayTransaction(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const item = document.createElement('li');
    item.classList.add('transaction-item', transaction.type);

    item.innerHTML = `
        <div class="transaction-details">
            <span>${transaction.description}</span>
            <span>${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${sign}Rp ${Math.abs(transaction.amount).toLocaleString('id-ID')}
            <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">x</button>
        </div>
    `;

    transactionList.appendChild(item);
}

// Fungsi untuk memperbarui saldo, pemasukan, dan pengeluaran
function updateBalance() {
    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0);
    const expense = amounts
        .filter(item => item < 0)
        .reduce((acc, item) => acc + item, 0);

    balance.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    incomeDisplay.innerText = `Rp ${income.toLocaleString('id-ID')}`;
    expenseDisplay.innerText = `Rp ${Math.abs(expense).toLocaleString('id-ID')}`;
}

// Fungsi untuk menambahkan transaksi
function addTransaction(e) {
    e.preventDefault();

    if (description.value.trim() === '' || amount.value.trim() === '') {
        alert('Harap masukkan deskripsi dan jumlah transaksi.');
        return;
    }

    const amountValue = +amount.value;
    const transaction = {
        id: generateID(),
        description: description.value,
        amount: type.value === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue),
        type: type.value
    };

    transactions.push(transaction);
    addTransactionDOM(transaction);
    updateLocalStorage();
    updateBalance();

    // Reset form
    form.reset();
}

// Fungsi untuk menambahkan transaksi ke DOM
function addTransactionDOM(transaction) {
    displayTransaction(transaction);
}

// Fungsi untuk menghapus transaksi
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

// Fungsi untuk memperbarui Local Storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Fungsi untuk mendownload transaksi sebagai CSV
function downloadTransactionsCSV() {
    if (transactions.length === 0) {
        alert('Tidak ada transaksi untuk didownload.');
        return;
    }

    // Header CSV
    const headers = ['ID', 'Deskripsi', 'Jumlah (Rp)', 'Tipe', 'Tanggal'];

    // Mengkonversi data transaksi ke format CSV
    const rows = transactions.map(tx => [
        tx.id,
        `"${tx.description.replace(/"/g, '""')}"`, // Menghindari masalah dengan koma dan tanda kutip
        tx.amount,
        tx.type.charAt(0).toUpperCase() + tx.type.slice(1), // Kapitalisasi tipe
        new Date().toLocaleDateString('id-ID') // Menambahkan tanggal transaksi
    ]);

    // Menggabungkan header dan baris data
    const csvContent = [headers, ...rows]
        .map(e => e.join(',')) // Menggabungkan setiap elemen dengan koma
        .join('\n'); // Menggabungkan setiap baris dengan newline

    // Membuat Blob dari string CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Membuat URL untuk Blob
    const url = URL.createObjectURL(blob);

    // Membuat elemen link untuk download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaksi_keuangan.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);

    // Men-trigger klik pada link untuk memulai download
    link.click();

    // Menghapus link dari DOM
    document.body.removeChild(link);

    // Notifikasi Download
    showToast('Download CSV telah dimulai.');
}

// Fungsi untuk mendownload transaksi sebagai XLSX
function downloadTransactionsXLSX() {
    if (transactions.length === 0) {
        alert('Tidak ada transaksi untuk didownload.');
        return;
    }

    // Menyiapkan data untuk Excel
    const data = transactions.map(tx => ({
        ID: tx.id,
        Deskripsi: tx.description,
        'Jumlah (Rp)': tx.amount,
        Tipe: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        Tanggal: new Date().toLocaleDateString('id-ID')
    }));

    // Membuat worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Membuat workbook dan menambahkan worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

    // Men-download workbook
    XLSX.writeFile(workbook, 'transaksi_keuangan.xlsx');

    // Notifikasi Download
    showToast('Download XLSX telah dimulai.');
}

// Fungsi untuk menampilkan toast
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        // Membuat elemen toast jika belum ada
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'hidden';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 3000);
}

// Fungsi untuk menginisialisasi aplikasi
function init() {
    transactionList.innerHTML = '';
    transactions.forEach(displayTransaction);
    updateBalance();
}

// Event Listener untuk form submit
form.addEventListener('submit', addTransaction);

// Event Listener untuk tombol Download CSV dan XLSX
downloadCSVBtn.addEventListener('click', downloadTransactionsCSV);
downloadXLSXBtn.addEventListener('click', downloadTransactionsXLSX);

// Inisialisasi aplikasi saat load
init();
