import React, { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  Users,
  ShoppingBag,
  Eye,
  EyeOff,
  Stethoscope,
} from "lucide-react";
import {
  collection,
  query,
  getDocs,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebase-config";
import AppointmentHistory from "../Reports/components/AppointmentHistory";
import OrderHistory from "../Reports/components/OrderHistory";
import {
  MonthlyRevenueChart,
  ServiceBreakdownChart,
  ProductsSoldChart,
  ServicesPerformedChart,
} from "../Reports/components/BusinessGraphs";
import StatusDropdown from "../../../components/StatusDropdown";
import ExportButton from "./components/ExportButton";

const SERVICE_CATEGORIES = ["Consultation", "Grooming", "Dental Care"];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekNames = ["Week1", "Week2", "Week3", "Week4"];

const getMonthDisplay = (date) => {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const isSameMonth = (date1, date2) => {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const getWeekOfMonth = (date) => {
  const day = date.getDate();
  if (day <= 7) return "Week1";
  if (day <= 14) return "Week2";
  if (day <= 21) return "Week3";
  return "Week4";
};

function MetricCard({ title, value, icon: Icon, isToggleable = false }) {
  const [isVisible, setIsVisible] = useState(false); //change to true if visible by default

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="bg-background p-6 rounded-lg shadow-sm border-2 border-green3/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-primary font-nunito-bold">{title}</p>
            {isToggleable && (
              <button
                onClick={toggleVisibility}
                className="text-green2 hover:text-green3 transition-colors"
              >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          <p className="text-2xl font-nunito-bold mt-2 text-primary">
            {isToggleable ? (isVisible ? value : "*****") : value}
          </p>
        </div>
        <div className="p-3 rounded-full bg-green3/10 text-green2">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    monthlyRevenue: [],
    weeklyRevenue: [],
    monthlyProducts: [],
    weeklyProducts: [],
    monthlyServices: [],
    serviceBreakdown: [],
    serviceBreakdownByMonth: {},
  });
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const processData = (ordersData, appointmentsData, usersCount) => {
    const orderGroups = {};
    let totalRevenue = 0;
    let totalProducts = 0;
    const monthlyData = {};
    const weeklyData = {};
    const productMonthlyData = {};
    const productWeeklyData = {};
    const processedOrders = new Set();
    const months = new Set();

    ordersData.forEach((data) => {
      const timestamp = data.createdAt?.seconds * 1000;
      const orderDate = new Date(timestamp);
      months.add(orderDate.toISOString().slice(0, 7));
      const monthKey = monthNames[orderDate.getMonth()];
      const weekKey = getWeekOfMonth(orderDate);
      const monthWeekKey = `${monthKey}-${weekKey}`;
      const orderTotal = data.price * data.quantity;

      if (!processedOrders.has(data.id)) {
        totalProducts += data.quantity;
        processedOrders.add(data.id);
      }

      const groupKey = `${data.userId}_${timestamp}`;
      if (!orderGroups[groupKey]) {
        orderGroups[groupKey] = {
          orderId: groupKey,
          userId: data.userId,
          userName: data.userName,
          date: orderDate,
          items: [],
          total: 0,
        };
      }

      orderGroups[groupKey].items.push({
        productId: data.productId,
        productName: data.productName,
        productImage: data.productImage,
        price: data.price,
        quantity: data.quantity,
      });
      orderGroups[groupKey].total += orderTotal;

      totalRevenue += orderTotal;
      productMonthlyData[monthKey] =
        (productMonthlyData[monthKey] || 0) + data.quantity;
      productWeeklyData[monthWeekKey] =
        (productWeeklyData[monthWeekKey] || 0) + data.quantity;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + orderTotal;
      weeklyData[monthWeekKey] = (weeklyData[monthWeekKey] || 0) + orderTotal;
    });

    appointmentsData.forEach((appointment) => {
      months.add(new Date(appointment.date).toISOString().slice(0, 7));
    });

    const serviceMonthlyData = {};
    const serviceCategories = SERVICE_CATEGORIES.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    // Track service breakdown by month
    const serviceBreakdownByMonth = {};

    let appointmentRevenue = 0;

    appointmentsData.forEach((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const monthKey = monthNames[appointmentDate.getMonth()];
      const weekKey = getWeekOfMonth(appointmentDate);
      const monthWeekKey = `${monthKey}-${weekKey}`;
      const yearMonthKey = appointmentDate.toISOString().slice(0, 7);
      const price = parseInt(appointment.price?.replace(/[^\d]/g, "")) || 0;

      appointmentRevenue += price;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + price;
      weeklyData[monthWeekKey] = (weeklyData[monthWeekKey] || 0) + price;

      if (!serviceMonthlyData[monthKey]) {
        serviceMonthlyData[monthKey] = SERVICE_CATEGORIES.reduce(
          (acc, category) => {
            acc[category] = 0;
            return acc;
          },
          {}
        );
      }

      // Initialize month-specific service tracking
      if (!serviceBreakdownByMonth[yearMonthKey]) {
        serviceBreakdownByMonth[yearMonthKey] = SERVICE_CATEGORIES.reduce(
          (acc, category) => {
            acc[category] = 0;
            return acc;
          },
          {}
        );
      }

      const service = appointment.service;
      if (service) {
        let category = null;

        if (service.toLowerCase().includes("consultation")) {
          category = "Consultation";
        } else if (service.toLowerCase().includes("grooming")) {
          category = "Grooming";
        } else if (service.toLowerCase().includes("dental")) {
          category = "Dental Care";
        }

        if (category) {
          serviceCategories[category]++;
          serviceMonthlyData[monthKey][category]++;
          serviceBreakdownByMonth[yearMonthKey][category]++;
        }
      }
    });

    const totalServices = Object.values(serviceCategories).reduce(
      (a, b) => a + b,
      0
    );
    const serviceBreakdown = Object.entries(serviceCategories)
      .map(([name, value]) => ({
        name,
        value:
          totalServices > 0 ? Math.round((value / totalServices) * 100) : 0,
      }))
      .filter((item) => item.value > 0);

    const servicesData = Object.entries(serviceMonthlyData)
      .map(([month, categories]) => ({
        month,
        ...categories,
      }))
      .sort(
        (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
      );

    const revenueData = Object.entries(monthlyData)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .sort(
        (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
      );

    const weeklyRevenueData = Object.entries(weeklyData)
      .map(([monthWeek, revenue]) => {
        const [month, week] = monthWeek.split("-");
        return {
          month,
          week,
          revenue,
          displayName: `${month}-${week}`,
        };
      })
      .sort((a, b) => {
        const monthDiff =
          monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        if (monthDiff !== 0) return monthDiff;
        return weekNames.indexOf(a.week) - weekNames.indexOf(b.week);
      });

    const productsData = Object.entries(productMonthlyData)
      .map(([month, products]) => ({
        month,
        products,
      }))
      .sort(
        (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
      );

    const weeklyProductsData = Object.entries(productWeeklyData)
      .map(([monthWeek, products]) => {
        const [month, week] = monthWeek.split("-");
        return {
          month,
          week,
          products,
          displayName: `${month}-${week}`,
        };
      })
      .sort((a, b) => {
        const monthDiff =
          monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        if (monthDiff !== 0) return monthDiff;
        return weekNames.indexOf(a.week) - weekNames.indexOf(b.week);
      });

    const sortedMonths = Array.from(months).sort();
    setAvailableMonths(sortedMonths);

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (sortedMonths.includes(currentMonth)) {
      setSelectedMonth(currentMonth);
    }

    setMetrics({
      totalRevenue: totalRevenue + appointmentRevenue,
      shopRevenue: totalRevenue,
      serviceRevenue: appointmentRevenue,
      totalCustomers: usersCount,
      totalProducts,
      monthlyRevenue: revenueData,
      weeklyRevenue: weeklyRevenueData,
      monthlyProducts: productsData,
      weeklyProducts: weeklyProductsData,
      monthlyServices: servicesData,
      serviceBreakdown,
      serviceBreakdownByMonth,
    });

    setOrders(Object.values(orderGroups).sort((a, b) => b.date - a.date));
    setAppointments(appointmentsData);
  };

  useEffect(() => {
    // Set up real-time listeners
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "in", ["Confirmed", "Received"])
    );

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("status", "==", "Concluded")
    );

    const usersQuery = query(collection(db, "users"));

    // Create snapshot listeners
    const unsubOrders = onSnapshot(ordersQuery, (ordersSnapshot) => {
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get appointments and users data when orders change
      getDocs(appointmentsQuery).then((appointmentsSnapshot) => {
        const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        getDocs(usersQuery).then((usersSnapshot) => {
          processData(ordersData, appointmentsData, usersSnapshot.size);
        });
      });
    });

    const unsubAppointments = onSnapshot(
      appointmentsQuery,
      (appointmentsSnapshot) => {
        const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get orders and users data when appointments change
        getDocs(ordersQuery).then((ordersSnapshot) => {
          const ordersData = ordersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          getDocs(usersQuery).then((usersSnapshot) => {
            processData(ordersData, appointmentsData, usersSnapshot.size);
          });
        });
      }
    );

    // Cleanup function
    return () => {
      unsubOrders();
      unsubAppointments();
    };
  }, []);

  const filterDataByMonth = (data, selectedMonth) => {
    if (selectedMonth === "all") return data;
    const targetDate = new Date(selectedMonth);
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return isSameMonth(itemDate, targetDate);
    });
  };

  const filteredOrders = filterDataByMonth(orders, selectedMonth);
  const filteredAppointments = filterDataByMonth(appointments, selectedMonth);

  // Get month-specific service breakdown
  const getFilteredServiceBreakdown = () => {
    if (selectedMonth === "all") {
      return metrics.serviceBreakdown;
    }

    const monthData = metrics.serviceBreakdownByMonth[selectedMonth];
    if (!monthData) return [];

    const totalMonthServices = Object.values(monthData).reduce(
      (a, b) => a + b,
      0
    );
    return Object.entries(monthData)
      .map(([name, value]) => ({
        name,
        value:
          totalMonthServices > 0
            ? Math.round((value / totalMonthServices) * 100)
            : 0,
      }))
      .filter((item) => item.value > 0);
  };

  // Calculate filtered shop and service revenues
  const shopRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const serviceRevenue = filteredAppointments.reduce(
    (sum, apt) => sum + parseInt(apt.price?.replace(/[^\d]/g, "") || 0),
    0
  );

  const filteredMetrics = {
    ...metrics,
    shopRevenue,
    serviceRevenue,
    totalRevenue: shopRevenue + serviceRevenue,
    totalProducts:
      selectedMonth === "all"
        ? metrics.totalProducts
        : filteredOrders.reduce(
            (sum, order) =>
              sum +
              order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
            0
          ),
    totalCustomers:
      selectedMonth === "all"
        ? metrics.totalCustomers
        : new Set([
            ...filteredOrders.map((order) => order.userId),
            ...filteredAppointments.map((apt) => apt.userId),
          ]).size,
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 mt-12">
      <div>
        <h1 className="text-2xl font-nunito-bold text-green2">
          Business Reports
        </h1>
        <div className="relative mt-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <BarChart2 className="mr-2 text-primary size-7" />
              <p className="text-xl text-primary font-nunito-bold tracking-wide">
                Comprehensive Business Analytics
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green2 font-nunito-semibold whitespace-nowrap">
                  Show results for:
                </span>
                <StatusDropdown
                  statusOptions={[
                    "All Time",
                    ...availableMonths.map((month) =>
                      getMonthDisplay(new Date(month))
                    ),
                  ]}
                  selectedStatus={
                    selectedMonth === "all"
                      ? "All Time"
                      : getMonthDisplay(new Date(selectedMonth))
                  }
                  onStatusChange={(selected) => {
                    if (selected === "All Time") {
                      setSelectedMonth("all");
                    } else {
                      const monthDate = availableMonths.find(
                        (month) => getMonthDisplay(new Date(month)) === selected
                      );
                      setSelectedMonth(monthDate);
                    }
                  }}
                />
              </div>
              <ExportButton
                metrics={filteredMetrics}
                selectedMonth={selectedMonth}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Customers"
          value={filteredMetrics.totalCustomers.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Total Products Sold"
          value={filteredMetrics.totalProducts.toLocaleString()}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Shop Revenue"
          value={`₱${filteredMetrics.shopRevenue.toLocaleString()}`}
          icon={ShoppingBag}
          isToggleable={true}
        />
        <MetricCard
          title="Service Revenue"
          value={`₱${filteredMetrics.serviceRevenue.toLocaleString()}`}
          icon={Stethoscope}
          isToggleable={true}
        />
        <MetricCard
          title="Total Revenue"
          value={`₱${filteredMetrics.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          isToggleable={true}
        />
      </div>

      <AppointmentHistory appointments={filteredAppointments} />
      <OrderHistory orders={filteredOrders} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyRevenueChart
          data={metrics.monthlyRevenue}
          weeklyData={metrics.weeklyRevenue}
          selectedMonth={selectedMonth}
        />
        <ServiceBreakdownChart
          data={getFilteredServiceBreakdown()}
          selectedMonth={selectedMonth}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ProductsSoldChart
          data={metrics.monthlyProducts}
          weeklyData={metrics.weeklyProducts}
          selectedMonth={selectedMonth}
        />
        <ServicesPerformedChart
          data={metrics.monthlyServices}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  );
}

export default Reports;
