import { useCallback } from "react";
import { MdFilledButton } from "../components/material";
import { useNavigate } from "react-router-dom";

export default function Root() {
    const navigate = useNavigate();
    const startNewDIY = useCallback(()=>{
        navigate("/new");
    },[]);

    return (
        <div id="home">
            <h1>DIY-Tutorial-Mate</h1>
            <p>An LLM-powered Text editor to help you write a DIY tutorial</p>
            <MdFilledButton onClick={startNewDIY}>Start DIY Tutorial</MdFilledButton>
            <hr />
        </div>
    );
}