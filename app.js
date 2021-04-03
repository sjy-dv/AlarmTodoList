const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { PORT } = process.env;
const db = require("./models");
const Todo = db.Todo;
const http_server = require("http").createServer(app).listen(PORT);
const noti = require("node-notifier");
const logger = require("morgan");
const io = require("socket.io")(http_server);

//init
io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

db.sequelize.authenticate().then(async () => {
  try {
    await db.sequelize.sync({ force: false });
  } catch (error) {
    console.log(error);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));

setInterval(async () => {
  console.log("check start");
  try {
    let Now = new Date();
    let isHour = Now.getHours();
    let isMinute = Now.getMinutes();
    const rows = await Todo.findAll();
    if (rows.length === 0) return;
    let recent_schedule = rows[0].timestamps;
    let schedule_hour = recent_schedule.split(":")[0];
    let schedule_minute = recent_schedule.split(":")[1];
    if (Number(schedule_hour) > Number(isHour)) {
      return;
    } else if (Number(schedule_hour) < Number(isHour)) {
      try {
        const destroy = await Todo.destroy({
          where: {
            idx: rows[0].idx,
          },
        });
        io.emit("destroy");
      } catch (error) {}
    } else if (Number(schedule_hour) === Number(isHour)) {
      if (Number(schedule_minute) < Number(isMinute)) {
        try {
          const destroy = await Todo.destroy({
            where: {
              idx: rows[0].idx,
            },
          });
          io.emit("destroy");
        } catch (error) {}
      } else {
        if (Number(Number(schedule_minute) - Number(isMinute)) === 5) {
          noti.notify({
            title: "5 minutes left.",
            message: "완료하지 않을 경우 실패 처리 됩니다.",
          });
        } else if (Number(Number(schedule_minute) - Number(isMinute)) === 1) {
          noti.notify({
            title: "1 minutes left.",
            message: "완료하지 않을 경우 실패 처리 됩니다.",
          });
        } else if (Number(schedule_minute) === Number(isMinute)) {
          noti.notify({
            title: "Time expired",
            message: `"${rows[0].desc}"을 제시간에 완료하지 못하여 자동 실패처리 됩니다.`,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}, 1000 * 60); //1분마다 체크

app.get("/todo/list", async (req, res) => {
  try {
    const rows = await Todo.findAll();
    if (rows.length > 0) {
      noti.notify({
        title: "Now Todo Event",
        message: rows[0].desc,
      });
    }
    res.status(200).json({ result: rows });
  } catch (error) {
    res.status(200).json({ error: error });
  }
});

app.post("/todo/create", async (req, res) => {
  try {
    let { timestamps, desc } = req.body;
    const rows = await Todo.create({
      timestamps: timestamps,
      desc: desc,
    });
    if (rows) res.status(200).json({ result: true });
  } catch (error) {
    res.status(200).json({ error: error });
  }
});

app.post("/todo/delete", async (req, res) => {
  try {
    let { idx } = req.body;
    const rows = await Todo.destroy({
      where: { idx: idx },
    });
    if (rows) res.status(200).json({ result: true });
  } catch (error) {
    res.status(200).json({ error: error });
  }
});
