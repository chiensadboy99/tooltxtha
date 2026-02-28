const http = require("http");

const PORT = process.env.PORT || 3000;

// ===== CACHE 5 GIÂY =====
let cache = {
    tx: { data: null, time: 0 },
    txmd5: { data: null, time: 0 }
};

const CACHE_TIME = 5000;

// ===== GỌI API =====
async function fetchRaw(apiUrl) {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Không lấy được dữ liệu API");
    return await res.json();
}

// ===== FORMAT DATA =====
function formatData(data) {
    if (!data.list) throw new Error("Sai cấu trúc JSON");

    return data.list.map(item => ({
        Ket_qua: item.resultTruyenThong === "TAI" ? "Tài" : "Xỉu",
        Phien: item.id,
        Tong: item.point,
        Xuc_xac_1: item.dices[0],
        Xuc_xac_2: item.dices[1],
        Xuc_xac_3: item.dices[2],
        id: "@cskh_huydaixu"
    }));
}

// ===== LẤY DATA CÓ CACHE =====
async function getData(type) {
    const now = Date.now();

    if (cache[type].data && now - cache[type].time < CACHE_TIME) {
        return cache[type].data;
    }

    const url = type === "tx"
        ? "https://wtx.tele68.com/v1/tx/sessions"
        : "https://wtxmd52.tele68.com/v1/txmd5/sessions";

    const raw = await fetchRaw(url);
    const formatted = formatData(raw);

    cache[type] = {
        data: formatted,
        time: now
    };

    return formatted;
}

// ===== SERVER =====
const server = http.createServer(async (req, res) => {

    res.setHeader("Content-Type", "application/json; charset=UTF-8");

    try {

        if (req.url === "/api/tx") {
            const result = await getData("tx");
            return res.end(JSON.stringify(result));
        }

        if (req.url === "/api/txmd5") {
            const result = await getData("txmd5");
            return res.end(JSON.stringify(result));
        }

        if (req.url === "/") {
            return res.end(JSON.stringify({
                message: "API hoạt động",
                endpoints: [
                    "/api/tx",
                    "/api/txmd5"
                ]
            }));
        }

        res.statusCode = 404;
        res.end(JSON.stringify({
            error: "Endpoint không tồn tại"
        }));

    } catch (err) {
        res.end(JSON.stringify({
            error: err.message
        }));
    }

});

server.listen(PORT, () => {
    console.log("Server chạy tại cổng " + PORT);
});