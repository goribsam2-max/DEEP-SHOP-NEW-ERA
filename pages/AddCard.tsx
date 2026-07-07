import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";

const AddCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 animate-fade-in min-h-screen">
      

      <div className="w-full aspect-[1.6/1] bg-zinc-900 dark:bg-zinc-50 dark:text-black rounded-2xl p-6 text-white mb-10 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start z-10">
          <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900/20 rounded-full"></div>
          <span className="font-bold italic">VISA</span>
        </div>
        <div className="z-10">
          <p className="text-xl font-mono tracking-normal mb-6">
            4716 9627 1635 8047
          </p>
          <div className="flex justify-between">
            <div>
              <p className="text-[8px] opacity-60 ">Card Holder Name</p>
              <p className="text-sm font-bold">Esther Howard</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] opacity-60 ">Expiry Date</p>
              <p className="text-sm font-bold">02/30</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 dark:bg-zinc-900/10 rounded-full -translate-y-16 translate-x-16"></div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2">
            Card Holder Name
          </label>
          <input
            type="text"
            placeholder="Esther Howard"
            className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Card Number</label>
          <input
            type="text"
            placeholder="4716 9627 1635 8047"
            className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Expiry Date</label>
            <input
              type="text"
              placeholder="02/30"
              className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">CVV</label>
            <input
              type="text"
              placeholder="000"
              className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none"
            />
          </div>
        </div>
        
      </div>

      <Button variant="primary" onClick={() => navigate(-1)} className="w-full mt-10">
        Add Card
      </Button>
    </div>
  );
};

export default AddCard;
