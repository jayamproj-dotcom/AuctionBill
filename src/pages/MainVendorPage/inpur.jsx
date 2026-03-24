import {useState} from "react";
import React from 'react'
const inpur = () => {

    const [value,setValue]=useState("")
  return (
    <div>
     <lable>enter the value</lable>
     <input value={value} onChange={(e)=>{setValue(e.target.value)}} type="text" />
     <p>{value}</p>
    </div>
  )
}

export default inpur
