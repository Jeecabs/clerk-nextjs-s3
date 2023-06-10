import styles from "/styles/Shared.module.css";
import Header from "./Header";

const Layout = ({ children }: { children: any }) => (
  <>
    <Header />
    <main className={styles.container}>{children}</main>
  </>
);

export default Layout;
