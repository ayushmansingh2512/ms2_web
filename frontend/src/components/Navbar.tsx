import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Modified: useLocation removed
import Lottie from "lottie-react";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const homeLottieRef = useRef<any>(null);
  const resourcesLottieRef = useRef<any>(null);
  const clubLottieRef = useRef<any>(null);
  const profileLottieRef = useRef<any>(null);
  // const location = useLocation(); // Modified: This line removed

  const [homeAnimation, setHomeAnimation] = useState<any>(null);
  const [resourcesAnimation, setResourcesAnimation] = useState<any>(null);
  const [clubAnimation, setClubAnimation] = useState<any>(null);
  const [profileAnimation, setProfileAnimation] = useState<any>(null);

  useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const [homeRes, resourcesRes, clubRes, profileRes] = await Promise.all([
          fetch("/home.json"),
          fetch("/resources.json"),
          fetch("/club.json"),
          fetch("/profile.json"),
        ]);
        const homeData = await homeRes.json();
        const resourcesData = await resourcesRes.json();
        const clubData = await clubRes.json(); // BUG FIX: Changed from resourcesRes.json()
        const profileData = await profileRes.json();
        setHomeAnimation(homeData);
        setResourcesAnimation(resourcesData);
        setClubAnimation(clubData);
        setProfileAnimation(profileData);
      } catch (error) {
        console.error("Error fetching Lottie animations:", error);
      }
    };
    fetchAnimations();
  }, []);

  // Check login status on component mount and listen for login events
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(!!token);
    };

    checkLoginStatus(); // Initial check

    window.addEventListener("loginEvent", checkLoginStatus);
    window.addEventListener("logoutEvent", checkLoginStatus);

    return () => {
      window.removeEventListener("loginEvent", checkLoginStatus);
      window.removeEventListener("logoutEvent", checkLoginStatus);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google/login`;
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNavClick = (ref: React.RefObject<any>) => {
    ref.current?.goToAndPlay(0, true);
  };

  const handleMenuItemClick = (action: string) => {
    setIsDropdownOpen(false);
    switch (action) {
      case 'Login':
        window.location.href = '/login';
        break;
      case 'Signup':
        window.location.href = '/signup';
        break;
      case 'LoginWithGoogle':
        handleGoogleLogin();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <style>{`
        .desktop-nav {
          display: flex;
        }
        
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: white;
          min-width: 200px;
          border-radius: 8px;
          z-index: 9999;
          box-shadow: 0px 4px 20px rgba(90, 69, 124, 0.15);
          border: 1px solid #e0e0e0;
          padding: 4px 0;
          font-family: 'Inter, sans-serif';
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          color: #333;
          text-decoration: none;
          font-family: 'Inter, sans-serif';
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: rgba(90, 69, 124, 0.08);
        }

        .dropdown-item-icon {
          min-width: 36px;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .dropdown-divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 4px 0;
        }

        .menu-button {
          background-color: rgba(194, 188, 188, 0.5);
          color: #5a457c;
          border: none;
          padding: 0;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          alignItems: center;
          height: 45px;
          width: 45px;
          justifyContent: center;
          margin-right: 10px;
        }

        .menu-button:hover {
          background-color: rgba(194, 188, 188, 0.8);
        }

        .burger-icon {
          width: 20px;
          height: 20px;
          filter: invert(36%) sepia(25%) saturate(1000%) hue-rotate(243deg) brightness(85%) contrast(95%);
        }
      `}</style>

      <nav
        style={{
          backgroundColor: "#f6f5f5",
          padding: "1rem",
          color: "black",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className="desktop-nav"
      >
        {/* Left side - Navigation Links */}
        <Link
          to="/"
          style={{
            color: "#3a97e3",
            textDecoration: "None",
            fontFamily: "rejoy",
            fontSize: "32px",
          }}
        >
          unino+e
        </Link>
        
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            onClick={() => handleNavClick(homeLottieRef)}
            style={{
              color: "Gray",
              textDecoration: "none",
              marginRight: "12px",
              transition: "background-color 0.3s ease",
              display: "flex",
              alignItems: "center",
            }}
          >
            {homeAnimation && (
              <Lottie
                lottieRef={homeLottieRef}
                animationData={homeAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 60, height: 60 }}
              />
            )}
            Home
          </Link>
          <Link
            to="/resources"
            onClick={() => handleNavClick(resourcesLottieRef)}
            style={{
              color: "gray",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            {resourcesAnimation && (
              <Lottie
                lottieRef={resourcesLottieRef}
                animationData={resourcesAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 50, height: 50 }}
              />
            )}
            Resources
          </Link>
          <Link
            to="/clubs"
            onClick={() => handleNavClick(clubLottieRef)}
            className="nav-link" // Modified: location.pathname condition removed
            style={{
              color: "gray",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            {clubAnimation && (
              <Lottie
                lottieRef={clubLottieRef}
                animationData={clubAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 50, height: 50 }}
              />
            )}
            Clubs
          </Link>
        </div>

        {/* Right side - Auth Section */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          {isLoggedIn ? (
            <Link
              to="/profile"
              onClick={() => handleNavClick(profileLottieRef)}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "transparent",
              }}
            >
              {profileAnimation && (
                <Lottie
                  lottieRef={profileLottieRef}
                  animationData={profileAnimation}
                  loop={false}
                  autoplay={false}
                  style={{ width: 50, height: 50 }}
                />
              )}
            </Link>
          ) : (
            <>
              <button
                onClick={toggleDropdown}
                className="menu-button"
              >
                <img className="burger-icon" src="/burger.svg" alt="Menu" />
              </button>

              {/* Dropdown Menu for Not Logged In */}
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => handleMenuItemClick('Login')}
                    className="dropdown-item"
                  >
                    <div className="dropdown-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a457c" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10,17 15,12 10,7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    </div>
                    Login
                  </button>
                  
                  <button
                    onClick={() => handleMenuItemClick('Signup')}
                    className="dropdown-item"
                  >
                    <div className="dropdown-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a457c" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                    </div>
                    Sign Up
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
