const express = require('express');
const fs = require('fs').promises; 
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');
const DATA_DIR = path.join(path.dirname(process.execPath), 'data');

app.use(cors());
app.use(express.json());

async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
        console.log('Đã tạo mới file data.json');
    }
}

async function readData() {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
}

async function writeData(data) {
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempFile, DATA_FILE);
}

app.get('/api/items', async (req, res) => {
    try {
        const items = await readData();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi đọc dữ liệu' });
    }
});

app.post('/api/items', async (req, res) => {
    try {
        const items = await readData();
        const newItem = {
            id: Date.now().toString(), 
            createdAt: new Date().toISOString(),
            ...req.body
        };
        items.push(newItem);
        await writeData(items);
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi lưu dữ liệu' });
    }
});
app.put('/api/items/:id', async (req, res) => {
    try {
        const items = await readData();
        const index = items.findIndex(item => item.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Không tìm thấy dữ liệu' });
        }

        items[index] = { ...items[index], ...req.body, updatedAt: new Date().toISOString() };
        await writeData(items);
        res.json(items[index]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi cập nhật dữ liệu' });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const items = await readData();
        const filteredItems = items.filter(item => item.id !== req.params.id);
        
        if (items.length === filteredItems.length) {
            return res.status(404).json({ error: 'Không tìm thấy dữ liệu để xóa' });
        }

        await writeData(filteredItems);
        res.json({ message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xóa dữ liệu' });
    }
});

initDataFile().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`App Server đang chạy tại: http://localhost:${PORT}`);
    });
});