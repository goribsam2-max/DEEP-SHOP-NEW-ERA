import React, { useEffect, useState, createContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminLayoutProps {
  userData: any;
}

export const StaffContext = createContext<{ 
  isStaff: boolean; 
  permissions: string[]; 
  isSuperAdmin: boolean 
}>({ isStaff: false, permissions: [], isSuperAdmin: false });

const AdminLayout: React.FC<AdminLayoutProps> = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<{ isStaff: boolean; permissions: string[]; isSuperAdmin: boolean }>({ isStaff: false, permissions: [], isSuperAdmin: false });
  const navigate = useNavigate();

  useEffect(() => {
    const checkStaff = async () => {
      if (!userData) {
        navigate('/');
        return;
      }
      const isSuperAdmin = userData.role === 'admin' || 
                           userData.email === 'admin@vibe.shop' || 
                           userData.email === 'admin@deepshop.top' || 
                           userData.email?.toLowerCase().trim() === 'vibegadgetfeni@gmail.com' ||
                           userData.email?.toLowerCase().trim() === 'deepshop@gmail.com' ||
                           userData.email?.toLowerCase().trim() === 'deepshopbysam@gmail.com';
      if (isSuperAdmin) {
        setStaffData({ isStaff: false, permissions: [], isSuperAdmin: true });
        setLoading(false);
        return;
      }

      const email = userData.email?.toLowerCase().trim();
      if (!email) {
        navigate('/');
        return;
      }

      try {
        const staffRef = doc(db, 'staff', email);
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists()) {
          const data = staffSnap.data();
          setStaffData({ isStaff: true, permissions: data.permissions || [], isSuperAdmin: false });
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        navigate('/');
      }
      setLoading(false);
    };
    checkStaff();
  }, [userData, navigate]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-medium">Checking permissions...</div>;
  }

  return (
    <StaffContext.Provider value={staffData}>
      <div className="w-full">
        <Outlet />
      </div>
    </StaffContext.Provider>
  );
};

export default AdminLayout;
