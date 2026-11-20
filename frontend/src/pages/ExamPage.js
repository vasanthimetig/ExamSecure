import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ExamPage = () => {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchPaper = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaper(res.data.paper);
      setTimeLeft(res.data.paper.durationMins * 60);
    };
    fetchPaper();
  }, [id]);

  useEffect(() => {
    if (timeLeft === 0) {
      alert("Time is up!");
      window.close();
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!paper) return <p>Loading paper...</p>;

  return (
    <div className="exam-container">
      <h2>{paper.title}</h2>
      <p>Stream: {paper.stream}</p>
      <h3>
        Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60}
      </h3>
      <iframe
        src={`http://localhost:5000/uploads/${paper.file}`}
        title="Question Paper"
        width="100%"
        height="500px"
      />
    </div>
  );
};

export default ExamPage;
