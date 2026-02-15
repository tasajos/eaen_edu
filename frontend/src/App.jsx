import LoginEAEN from "./components/LoginEAEN/LoginEAEN";

export default function App() {
  return (
    <LoginEAEN
      onLoginSuccess={(session) => {
        console.log("Login DEMO OK:", session);
        // Más adelante aquí haremos el navigate al dashboard
      }}
    />
  );
}
