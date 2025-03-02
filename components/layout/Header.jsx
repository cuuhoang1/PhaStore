import { useState, useCallback  } from "react";
import { FaUserAlt, FaShoppingCart, FaSearch } from "react-icons/fa";
import Logo from "../ui/Logo";
import Search from "../ui/Search";
import { GiHamburgerMenu, GiCancel } from "react-icons/gi";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";

const Header = () => {
  const [isSearchModal, setIsSearchModal] = useState(false);
  const [isMenuModal, setIsMenuModal] = useState(false);
  const cart = useSelector((state) => state.cart);

  const router = useRouter();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);

    useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  const handleSignOutstatus = useCallback(async () => {
    if (user) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName: user.tableName }),
      });
      signOut({ redirect: false });
      router.push("/auth/login");
    }
  }, [user, router]);

  useEffect(() => {
    let device;
    let intervalId;

    const checkBleConnection = async () => {
      const bleConnection = JSON.parse(localStorage.getItem('bleConnection'));
      if (bleConnection && status === "authenticated") {
        try {
          if (!device || !device.gatt.connected) {
            device = await navigator.bluetooth.requestDevice({
              filters: [{ name: `Bàn ${bleConnection.tableNumber}` }],
              optionalServices: ['battery_service', 'generic_access'],
            });

            device.addEventListener('gattserverdisconnected', handleDisconnect);

            await device.gatt.connect();
            setReconnectAttempts(0); // Đặt lại số lần thử kết nối
          }
        } catch (error) {
          console.error('Failed to reconnect:', error);
          handleDisconnect();
        }
      }
    };

    const handleDisconnect = async () => {
      setReconnectAttempts(prev => prev + 1);
      if (reconnectAttempts >= 3) { // Sau 3 lần thử kết nối thất bại
        localStorage.removeItem('bleConnection');
        await handleSignOutstatus();
      }
    };

    if (status === "authenticated") {
      intervalId = setInterval(checkBleConnection, 10000); // Kiểm tra mỗi 10 giây
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (device) {
        device.removeEventListener('gattserverdisconnected', handleDisconnect);
      }
    };
  }, [status, reconnectAttempts, handleSignOutstatus]);
  return (
    <div
      className={`h-[5.5rem] z-50 relative w-full ${
        router.asPath === "/" ? "bg-transparent fixed" : "bg-secondary"
      }`}
    >
      <div className="container mx-auto text-white flex justify-between items-center h-full">
        <Logo />
        <nav
          className={`sm:static absolute top-0 left-0 sm:w-auto sm:h-auto w-full h-screen sm:text-white text-black sm:bg-transparent bg-white sm:flex hidden z-50 ${
            isMenuModal === true && "!grid place-content-center"
          }`}
        >
          <ul className="flex gap-x-2 sm:flex-row flex-col items-center">
            <li
              className={`px-[5px] py-[10px] uppercase hover:text-primary cursor-pointer ${
                router.asPath === "/" && "text-primary"
              }}`}
              onClick={() => setIsMenuModal(false)}
            >
              <Link href="/">Trang Chủ</Link>
            </li>
            <li
              className={`px-[5px] py-[10px] uppercase hover:text-primary cursor-pointer ${
                router.asPath === "/menu" && "text-primary"
              }`}
              onClick={() => setIsMenuModal(false)}
            >
              <Link href="/menu">Thực Đơn</Link>
            </li>
            <li
              className={`px-[5px] py-[10px] uppercase hover:text-primary cursor-pointer ${
                router.asPath === "/about" && "text-primary"
              }`}
              onClick={() => setIsMenuModal(false)}
            >
              <Link href="/about">Chi Tiết</Link>
            </li>
            <li
              className={`px-[5px] py-[10px] uppercase hover:text-primary cursor-pointer ${
                router.asPath === "/payments" && "text-primary"
              }`}
              onClick={() => setIsMenuModal(false)}
            >
              <Link href="/payments">Thanh Toán</Link>
            </li>
            {/* <li
              className={`px-[5px] py-[10px] uppercase hover:text-primary cursor-pointer ${
                router.asPath === "/reservation" && "text-primary"
              }`}
              onClick={() => setIsMenuModal(false)}
            >
              
            </li> */}
            
          </ul>
          {isMenuModal && (
            <button
              className="absolute  top-4 right-4 z-50"
              onClick={() => setIsMenuModal(false)}
            >
              <GiCancel size={25} className=" transition-all" />
            </button>
          )}
        </nav>
        <div className="flex gap-x-4 items-center">
          <Link href="/auth/login">
            <span>
              {router.asPath.includes("auth") ? (
                <i
                  className={`fa-solid fa-right-to-bracket ${
                    router.asPath.includes("login") && "text-primary"
                  } `}
                ></i>
              ) : (
                <FaUserAlt
                  className={`hover:text-primary transition-all cursor-pointer ${
                    (router.asPath.includes("auth") ||
                      router.asPath.includes("profile")) &&
                    "text-primary"
                  }`}
                />
              )}
            </span>
          </Link>
          <Link href="/cart">
            <span className="relative">
              <FaShoppingCart
                className={`hover:text-primary transition-all cursor-pointer`}
              />
              <span className="w-4 h-4 text-xs grid place-content-center rounded-full bg-primary absolute -top-2 -right-3 text-black font-bold">
                {cart.products.length === 0 ? "0" : cart.products.length}
              </span>
            </span>
          </Link>
          <button onClick={() => setIsSearchModal(true)}>
            <FaSearch className="hover:text-primary transition-all cursor-pointer" />
          </button>
          <a href="#" className="md:inline-block hidden sm">
            
          </a>
          <button
            className="sm:hidden inline-block"
            onClick={() => setIsMenuModal(true)}
          >
            <GiHamburgerMenu className="text-xl hover:text-primary transition-all" />
          </button>
        </div>
      </div>
      {isSearchModal && <Search setIsSearchModal={setIsSearchModal} />}
    </div>
  );
};

export default Header;
