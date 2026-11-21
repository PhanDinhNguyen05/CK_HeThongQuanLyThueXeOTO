import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  adminApi,
  bookingApi,
  customerApi,
  operationsApi,
  paymentApi,
  rentalApi,
  vehicleApi,
} from '../api/endpoints';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [segments, setSegments] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [unpaidPayments, setUnpaidPayments] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [adminStats, setAdminStats] = useState({ totalCars: 0, totalContracts: 0, totalCustomers: 0 });
  const [loadingData, setLoadingData] = useState(false);

  const refreshPublicData = useCallback(async () => {
    try {
      const [metaRes, modelsRes] = await Promise.all([
        vehicleApi.getMeta(),
        vehicleApi.searchModels(),
      ]);
      setBrands(metaRes.data?.brands || []);
      setSegments(metaRes.data?.segments || []);
      setCars(metaRes.data?.cars || []);
      setCarModels(modelsRes.data || []);
    } catch {
      // Giữ nguyên state hiện tại nếu chưa kết nối được server
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  const clearPrivateData = useCallback(() => {
    setCustomers([]);
    setMembers([]);
    setEmployees([]);
    setAccounts([]);
    setBookings([]);
    setContracts([]);
    setPenalties([]);
    setPayments([]);
    setUnpaidPayments([]);
    setExtensionRequests([]);
    setMaintenanceLogs([]);
    setIncidents([]);
    setAdminStats({ totalCars: 0, totalContracts: 0, totalCustomers: 0 });
  }, []);

  const refreshForUser = useCallback(
    async (user) => {
      if (!user) {
        clearPrivateData();
        return;
      }
      setLoadingData(true);
      try {
        await refreshPublicData();

        if (user.VaiTro === 'Khách hàng') {
          const [profileRes, bookingsRes, contractsRes, unpaidRes, historyRes] = await Promise.all([
            customerApi.getProfile(),
            bookingApi.list(),
            rentalApi.listContracts(),
            paymentApi.getUnpaid(),
            paymentApi.getHistory(),
          ]);
          const profile = profileRes.data;
          if (profile) {
            const { thanhVien, ...cust } = profile;
            setCustomers([cust]);
            setMembers(thanhVien ? [thanhVien] : []);
          }
          setBookings(bookingsRes.data || []);
          setContracts(contractsRes.data || []);
          setUnpaidPayments(unpaidRes.data || []);
          setPayments(historyRes.data || []);
        } else if (user.VaiTro === 'Nhân viên') {
          const [
            carsRes,
            customersRes,
            bookingsRes,
            contractsRes,
            extensionsRes,
            penaltiesRes,
            maintRes,
            incRes,
          ] = await Promise.all([
            vehicleApi.listCars(),
            customerApi.list(),
            bookingApi.list(),
            rentalApi.listContracts(),
            rentalApi.listExtensions(),
            rentalApi.listPenalties(),
            operationsApi.listMaintenance(),
            operationsApi.listIncidents(),
          ]);
          setCars(carsRes.data || []);
          setCustomers(customersRes.data || []);
          setBookings(bookingsRes.data || []);
          setContracts(contractsRes.data || []);
          setExtensionRequests(extensionsRes.data || []);
          setPenalties(penaltiesRes.data || []);
          setMaintenanceLogs(maintRes.data || []);
          setIncidents(incRes.data || []);
        } else if (user.VaiTro === 'Quản trị viên') {
          const [employeesRes, overviewRes] = await Promise.all([
            adminApi.listEmployees(),
            adminApi.getOverview(),
          ]);
          setEmployees(employeesRes.data || []);
          setAccounts(overviewRes.data?.accounts || []);
          setAdminStats({
            totalCars: overviewRes.data?.totalCars || 0,
            totalContracts: overviewRes.data?.totalContracts || 0,
            totalCustomers: overviewRes.data?.totalCustomers || 0,
          });
        }
      } finally {
        setLoadingData(false);
      }
    },
    [clearPrivateData, refreshPublicData]
  );

  const nextCode = (prefix, list, key) => {
    const nums = list
      .map((item) => parseInt(String(item[key] || '').replace(/\D/g, ''), 10))
      .filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  };

  return (
    <DataContext.Provider
      value={{
        brands,
        segments,
        carModels,
        setCarModels,
        cars,
        setCars,
        customers,
        setCustomers,
        members,
        setMembers,
        employees,
        setEmployees,
        accounts,
        setAccounts,
        bookings,
        setBookings,
        contracts,
        setContracts,
        penalties,
        setPenalties,
        payments,
        setPayments,
        unpaidPayments,
        setUnpaidPayments,
        extensionRequests,
        setExtensionRequests,
        maintenanceLogs,
        setMaintenanceLogs,
        incidents,
        setIncidents,
        adminStats,
        loadingData,
        refreshPublicData,
        refreshForUser,
        clearPrivateData,
        nextCode,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
