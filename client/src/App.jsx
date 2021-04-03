import "./style.scss";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import socketio from "socket.io-client";

const socket = socketio.connect("http://localhost:8081");
const today = new Date();
const week = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

let year = today.getFullYear();
let month = today.getMonth() + 1;
let date = today.getDate();
let get_today = today.getDay();
let today_name = week[get_today];
//❌
const App = () => {
  const [timestamp, setTimeStamp] = useState("");
  const [schedule, setSchedule] = useState("");
  const [todolist, setTodoList] = useState([]);

  useEffect(() => {
    getTodo();
    socket.on("destroy", () => {
      getTodo();
    });
  }, []);

  const setTodo = async (e) => {
    e.preventDefault();
    try {
      await axios
        .post("/todo/create", {
          timestamps: timestamp,
          desc: schedule,
        })
        .then((res) => {
          if (res.data.result) {
            alert("일정이 추가되었습니다.");
            setTimeStamp("");
            setSchedule("");
            getTodo();
          }
          if (res.data.error) {
            alert(res.data.error);
          }
        });
    } catch (error) {}
  };

  const getTodo = async () => {
    try {
      await axios.get("/todo/list").then((res) => {
        if (res.data.result) {
          setTodoList(res.data.result);
        }
        if (res.data.error) {
          alert(res.data.error);
        }
      });
    } catch (error) {}
  };

  const okTodo = async (idx) => {
    try {
      await axios.post("/todo/delete", {
        idx: idx,
      });
      setTimeout(async () => {
        await getTodo();
      }, 3000);
    } catch (error) {}
  };

  return (
    <>
      <div className="App" style={{ marginTop: "5%" }}>
        <h1>Simple Todo List with Alarm</h1>
        <br />
        <br />
        <label>스케줄 시간</label>&nbsp;&nbsp;&nbsp;
        <input
          type="time"
          value={timestamp}
          onChange={(e) => setTimeStamp(e.target.value)}
        />
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;
        <label>스케줄 내용</label>
        &nbsp;&nbsp;&nbsp;
        <input
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
        />
        <br />
        <br />
        <button onClick={setTodo}>등록하기</button>
        <div className="frame">
          <div className="center">
            <section className="todo-cmp">
              <header className="todo-cmp__header">
                <h2>{today_name}</h2>
                <p>
                  {year}년 {month}월 {date}일
                </p>
              </header>
              <ul className="todo-cmp__list">
                {todolist.map((k) => {
                  return (
                    <li key={k.idx}>
                      <label htmlFor="todo">
                        <input
                          id="todo"
                          type="checkbox"
                          onClick={() => okTodo(k.idx)}
                        />
                        <span>
                          ({k.timestamps})&nbsp;&nbsp;{k.desc}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};
export default App;
