import "../../styles/admin.css";
import LoginForm from "../../components/admin/LoginForm";

export const metadata = { title: "Admin Login — Antique Home" };

export default function AdminLoginPage() {
  return (
    <div className="admin">
      <div className="admin__loginWrap">
        <div className="admin__loginCard">
          <div className="admin__logo">
            <span className="admin__logo-name">ANTIQUE HOME</span>
            <span className="admin__logo-sub">Timeless Living</span>
          </div>
          <h1>Admin Sign In</h1>
          <p>Manage your store, orders and products.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
