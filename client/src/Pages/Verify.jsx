import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useAuth from "../Hooks/useAuth.js";

export default function SignupVerification() {
    const navigate = useNavigate();
    const { verifyEmail } = useAuth();

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            navigate("/not-found");
            return;
        }

        verifyEmail(token)
            .then(() => {
                navigate("/dashboard");
            })
            .catch((err) => {
                console.error("Email verification failed", err);
                navigate("/not-found");
            });
    }, [token, navigate, verifyEmail]);

    return <div>Verifying your email...</div>;
}