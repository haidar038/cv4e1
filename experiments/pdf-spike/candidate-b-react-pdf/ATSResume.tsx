import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 36,
    paddingRight: 36,
    color: '#000',
  },
  header: { marginBottom: 12 },
  name: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  headline: { fontSize: 11, marginTop: 2, color: '#333' },
  contact: { fontSize: 9, marginTop: 4, color: '#222' },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 5,
  },
  item: { marginBottom: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontWeight: 'bold', flex: 1, marginRight: 8 },
  itemDates: { fontSize: 9, whiteSpace: 'nowrap' },
  itemSub: { fontStyle: 'italic', fontSize: 9, color: '#333', marginTop: 1 },
  highlightList: { marginTop: 3, marginLeft: 12, listStyleType: 'disc' },
  summary: { marginTop: 3 },
  skillsLine: { marginTop: 2 },
  skillsLabel: { fontWeight: 'bold' },
});

export default function ATSResumePDF() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>Rania Putri Maharani</Text>
          <Text style={styles.headline}>Fresh Graduate Teknik Informatika</Text>
          <Text style={styles.contact}>
            Ternate, Maluku Utara · +62 812-0000-0000 · rania.contoh@example.com · LinkedIn: linkedin.com/in/contoh
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <Text style={styles.summary}>
            Lulusan Teknik Informatika dengan pengalaman organisasi kemahasiswaan dan proyek akhir di bidang pengembangan web. Terbiasa bekerja dalam tim kecil dan mengelola jadwal kegiatan.
          </Text>
        </View>

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendidikan</Text>
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>S1 Teknik Informatika — Universitas Contoh Nusantara</Text>
              <Text style={styles.itemDates}>Agustus 2021 – Juli 2025</Text>
            </View>
            <Text style={styles.itemSub}>Rekayasa Perangkat Lunak · Ternate · IPK 3.52 / 4.00</Text>
            <Text style={{ marginTop: 3 }}>• Tugas akhir: sistem informasi pendataan UMKM berbasis web</Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengalaman Kerja</Text>
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Magang Pengembang Web — CV Contoh Digital</Text>
              <Text style={styles.itemDates}>Juli 2024 – Desember 2024</Text>
            </View>
            <Text style={styles.itemSub}>Ternate</Text>
            <Text style={{ marginTop: 3 }}>• Membangun tiga halaman antarmuka untuk aplikasi pendataan internal</Text>
            <Text>• Menyusun dokumentasi penggunaan aplikasi untuk staf non-teknis</Text>
          </View>
        </View>

        {/* Organizations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organisasi</Text>
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Koordinator Divisi Acara — Himpunan Mahasiswa Teknik Informatika</Text>
              <Text style={styles.itemDates}>Januari 2023 – Desember 2023</Text>
            </View>
            <Text style={{ marginTop: 3 }}>• Mengkoordinasikan panitia beranggotakan 15 orang untuk seminar teknologi tingkat fakultas</Text>
            <Text>• Menyusun rundown dan jadwal koordinasi mingguan selama masa persiapan</Text>
          </View>
        </View>

        {/* Projects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proyek</Text>
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Sistem Pendataan UMKM — Tugas akhir</Text>
              <Text style={styles.itemDates}>September 2024 – Juni 2025</Text>
            </View>
            <Text style={{ marginTop: 3 }}>• Merancang basis data dan antarmuka pendataan untuk 5 kategori usaha</Text>
            <Text>• Menguji aplikasi bersama 8 pelaku usaha untuk mengumpulkan masukan</Text>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keahlian</Text>
          <View style={styles.skillsLine}>
            <Text><Text style={styles.skillsLabel}>Teknis:</Text> JavaScript, React, HTML, CSS, Git, MySQL</Text>
          </View>
          <View style={styles.skillsLine}>
            <Text><Text style={styles.skillsLabel}>Bahasa:</Text> Bahasa Indonesia, Bahasa Inggris (pasif)</Text>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sertifikasi</Text>
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Belajar Dasar Pemrograman Web — Platform Pelatihan Contoh</Text>
              <Text style={styles.itemDates}>Maret 2024</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}