import Header from "@/components/Header";
import SignUpForm from "@/components/SignUpForm";
import { useNavigate, useSearchParams } from "react-router-dom";
import carousel2 from "@/assets/carousel1.jpeg";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = searchParams.get("next") || "/";
  const initialFirst = searchParams.get("firstName") || "";
  const initialLast = searchParams.get("lastName") || "";
  const initialEmail = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto grid gap-8 md:grid-cols-2 items-center">
          <div className="mx-auto w-full max-w-lg">
            <SignUpForm
              onSwitchToSignIn={() => navigate("/login")}
              onClose={() => navigate(next)}
              initialValues={{
                firstName: initialFirst,
                lastName: initialLast,
                email: initialEmail,
              }}
            />
          </div>

          <div className="hidden md:block">
            <img
              src={carousel2}
              alt="Shoes on display"
              className="w-full shadow-lg object-cover h-auto"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
