import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This page redirects to the main auth page
const Connexion = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/auth", { replace: true });
  }, [navigate]);

  return null;
};

export default Connexion;