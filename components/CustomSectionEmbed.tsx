import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const CustomSectionEmbed = ({ location }: { location: string }) => {
   const [sections, setSections] = useState<string[]>([]);

   useEffect(() => {
      const q = query(collection(db, 'custom_sections'), where('location', '==', location), where('isActive', '==', true));
      const unsub = onSnapshot(q, (snap) => {
         const htmlList: string[] = [];
         snap.forEach(doc => {
             htmlList.push(doc.data().html);
         });
         setSections(htmlList);
      });
      return () => unsub();
   }, [location]);

   if (sections.length === 0) return null;

   return (
      <>
         {sections.map((html, i) => (
             <div key={i} className="w-full my-4" dangerouslySetInnerHTML={{ __html: html }} />
         ))}
      </>
   );
};
