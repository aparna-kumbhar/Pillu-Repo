import React, { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	Platform,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { fetchWithBaseUrlFallback } from "../../../Src/axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_MOBILE = SCREEN_WIDTH < 768;

const T = {
	pageBg: "#f4efe7",
	cardBg: "#fffaf3",
	cardBorder: "#eadfce",
	ink: "#1f2937",
	subtext: "#6b7280",
	muted: "#9ca3af",
	gold: "#c08a2a",
	goldDark: "#8a5a00",
	goldLight: "#f6e7c7",
	blue: "#244c73",
	blueLight: "#e6f0f8",
	green: "#2f855a",
	greenLight: "#e7f6ee",
	white: "#ffffff",
	shadow: "rgba(36, 76, 115, 0.10)",
};

const FieldLabel = ({ children }) => <Text style={styles.fieldLabel}>{children}</Text>;

const StatCard = ({ label, value, tone = "gold" }) => (
	<View style={[styles.statCard, tone === "blue" && styles.statCardBlue, tone === "green" && styles.statCardGreen]}>
		<Text style={[styles.statValue, tone === "blue" && styles.statValueBlue, tone === "green" && styles.statValueGreen]}>{value}</Text>
		<Text style={styles.statLabel}>{label}</Text>
	</View>
);

const ProfileInput = ({ value, onChangeText, editable, multiline = false, placeholder }) => (
	<TextInput
		value={value}
		onChangeText={onChangeText}
		editable={editable}
		multiline={multiline}
		placeholder={placeholder}
		placeholderTextColor={T.muted}
		style={[
			styles.input,
			multiline && styles.textArea,
			!editable && styles.inputReadOnly,
		]}
	/>
);

const formatDateLabel = (value) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const getInitials = (name) => {
	const parts = (name || "")
		.split(" ")
		.map((item) => item.trim())
		.filter(Boolean);

	if (!parts.length) return "TP";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export default function Profile({ teacher = null, instituteId = "" }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(null);
	const [isFetching, setIsFetching] = useState(false);
	const [fetchError, setFetchError] = useState("");

	const [fullName, setFullName] = useState("Dr. Ayesha Rahman");
	const [qualification, setQualification] = useState("M.Ed, PhD in Educational Psychology");
	const [age, setAge] = useState("38");
	const [experience, setExperience] = useState("14 years");
	const [subject, setSubject] = useState("Mathematics");
	const [employeeId, setEmployeeId] = useState("TCH-2048");
	const [email, setEmail] = useState("ayesha.rahman@universe.edu");
	const [phone, setPhone] = useState("+880 1712 345678");
	const [department, setDepartment] = useState("Senior School");
	const [joiningDate, setJoiningDate] = useState("12 Aug 2011");
	const [classAssigned, setClassAssigned] = useState("Grade 10 A, Grade 11 B");
	const [location, setLocation] = useState("Dhaka Campus");
	const [photoUri, setPhotoUri] = useState("");
	const [bio, setBio] = useState(
		"Passionate mathematics educator focused on concept clarity, exam readiness, and student confidence through structured learning and mentorship."
	);

	const applyTeacherData = (teacherData = {}) => {
		setFullName(teacherData.fullName || "");
		setQualification(teacherData.qualification || "");
		setExperience(teacherData.experience || "");
		setEmployeeId(teacherData.teacherId || "");
		setDepartment(teacherData.departmentName || "");
		setLocation(teacherData.instituteName || "");
		setJoiningDate(formatDateLabel(teacherData.createdAt));
		setPhotoUri(teacherData.photoUrl || teacherData.profilePhoto || teacherData.avatar || "");
	};

	const handlePickPhoto = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ["image/*"],
				multiple: false,
				copyToCacheDirectory: true,
			});

			if (result.canceled) {
				return;
			}

			const selectedUri = result.assets?.[0]?.uri || "";
			if (!selectedUri) {
				return;
			}

			if (editing) {
				setDraft((prev) => ({ ...(prev || {}), photoUri: selectedUri }));
				return;
			}

			setPhotoUri(selectedUri);
		} catch (error) {
			Alert.alert("Photo upload failed", "Unable to select image. Please try again.");
		}
	};

	useEffect(() => {
		if (teacher) {
			applyTeacherData(teacher);
		}
	}, [teacher]);

	useEffect(() => {
		const fetchTeacherDetails = async () => {
			const teacherDocId = (teacher?._id || "").trim();
			const resolvedInstituteId = (instituteId || teacher?.instituteId || "").trim();

			if (!teacherDocId || !resolvedInstituteId) {
				return;
			}

			setIsFetching(true);
			setFetchError("");

			try {
				const path = `/api/teachers/${teacherDocId}?instituteId=${encodeURIComponent(resolvedInstituteId)}`;
				const { response } = await fetchWithBaseUrlFallback(path);
				const payload = await response.json();

				if (!response.ok) {
					setFetchError(payload?.message || "Unable to fetch teacher profile details.");
					return;
				}

				applyTeacherData(payload || {});
			} catch (error) {
				setFetchError("Unable to fetch teacher profile details.");
			} finally {
				setIsFetching(false);
			}
		};

		fetchTeacherDetails();
	}, [teacher?._id, teacher?.instituteId, instituteId]);

	const handleSave = () => {
		if (draft) {
			setFullName(draft.fullName);
			setQualification(draft.qualification);
			setAge(draft.age);
			setExperience(draft.experience);
			setSubject(draft.subject);
			setEmployeeId(draft.employeeId);
			setEmail(draft.email);
			setPhone(draft.phone);
			setDepartment(draft.department);
			setJoiningDate(draft.joiningDate);
			setClassAssigned(draft.classAssigned);
			setLocation(draft.location);
			setPhotoUri(draft.photoUri || "");
			setBio(draft.bio);
		}
		setEditing(false);
		setDraft(null);
		Alert.alert("Profile updated", "Teacher profile information has been saved.");
	};

	const handleDiscard = () => {
		setEditing(false);
		setDraft(null);
	};

	const openEditor = () => {
		setDraft({
			fullName,
			qualification,
			age,
			experience,
			subject,
			employeeId,
			email,
			phone,
			department,
			joiningDate,
			classAssigned,
			location,
			photoUri,
			bio,
		});
		setEditing(true);
	};

	const displayedPhotoUri = (editing ? draft?.photoUri : photoUri) || photoUri;
	const titleName = fullName || "Teacher Profile";

	return (
		<ScrollView style={styles.page} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
			<View style={styles.backdropTop} />
			<View style={styles.backdropBottom} />

			<View style={styles.headerCard}>
				<View style={styles.headerRow}>
					<TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.85}>
						<View style={styles.avatar}>
							{displayedPhotoUri ? (
								<Image source={{ uri: displayedPhotoUri }} style={styles.avatarImage} />
							) : (
								<Text style={styles.avatarText}>{getInitials(fullName)}</Text>
							)}
						</View>
						<Text style={styles.avatarUploadText}>Add Photo</Text>
					</TouchableOpacity>

					<View style={styles.headerTextBlock}>
						<Text style={styles.pageTitle}>{titleName}</Text>
						<Text style={styles.pageSubtitle}>
							Manage your teaching information, professional background, and class assignments in one clean dashboard.
						</Text>
						{isFetching ? <Text style={styles.fetchHint}>Loading latest profile details...</Text> : null}
						{!isFetching && fetchError ? <Text style={styles.fetchError}>{fetchError}</Text> : null}

						<View style={styles.badgeRow}>
							<View style={styles.badge}>
								<Text style={styles.badgeText}>FACULTY MEMBER</Text>
							</View>
							<View style={[styles.badge, styles.badgeSoft]}>
								<Text style={[styles.badgeText, styles.badgeTextSoft]}>ACTIVE</Text>
							</View>
						</View>
					</View>

					<TouchableOpacity
						style={styles.editButton}
						onPress={openEditor}
						activeOpacity={0.85}
						accessibilityRole="button"
						accessibilityLabel="Open edit profile form"
					>
						<Text style={styles.editButtonText}>Edit Profile</Text>
					</TouchableOpacity>
				</View>

				<View style={[styles.statRow, IS_MOBILE && styles.statRowStack]}>
					<StatCard label="Experience" value={experience} tone="gold" />
					<StatCard label="Qualification" value="Post Graduate" tone="blue" />
					<StatCard label="Assigned Classes" value="2 Classes" tone="green" />
				</View>
			</View>

			<View style={[styles.contentGrid, IS_MOBILE && styles.contentGridStack]}>
				<View style={styles.leftColumn}>
					<View style={styles.card}>
						<Text style={styles.cardTitle}>Professional Summary</Text>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Full Name</Text>
							<Text style={styles.infoValue}>{fullName}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Qualification</Text>
							<Text style={styles.infoValue}>{qualification}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Age</Text>
							<Text style={styles.infoValue}>{age}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Experience</Text>
							<Text style={styles.infoValue}>{experience}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Subject</Text>
							<Text style={styles.infoValue}>{subject}</Text>
						</View>
					</View>

					<View style={[styles.card, styles.cardGap]}>
						<Text style={styles.cardTitle}>Work Details</Text>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Employee ID</Text>
							<Text style={styles.infoValue}>{employeeId}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Department</Text>
							<Text style={styles.infoValue}>{department}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Joining Date</Text>
							<Text style={styles.infoValue}>{joiningDate}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Class Assigned</Text>
							<Text style={styles.infoValue}>{classAssigned}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Campus</Text>
							<Text style={styles.infoValue}>{location}</Text>
						</View>
					</View>
				</View>

				<View style={styles.rightColumn}>
					<View style={styles.card}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.cardTitle}>Personal and Contact Information</Text>
								<Text style={styles.cardSubtitle}>Tap Edit Profile to open the update form.</Text>
							</View>
						</View>
						<View style={styles.infoCardGrid}>
							<View style={styles.infoChip}>
								<Text style={styles.infoChipLabel}>Email</Text>
								<Text style={styles.infoChipValue} numberOfLines={1}>{email}</Text>
							</View>
							<View style={styles.infoChip}>
								<Text style={styles.infoChipLabel}>Phone</Text>
								<Text style={styles.infoChipValue}>{phone}</Text>
							</View>
							<View style={styles.infoChip}>
								<Text style={styles.infoChipLabel}>Department</Text>
								<Text style={styles.infoChipValue}>{department}</Text>
							</View>
							<View style={styles.infoChip}>
								<Text style={styles.infoChipLabel}>Campus</Text>
								<Text style={styles.infoChipValue}>{location}</Text>
							</View>
						</View>
					</View>

					<View style={[styles.card, styles.cardGap]}>
						<Text style={styles.cardTitle}>Teaching Highlights</Text>
						<View style={styles.highlightList}>
							<View style={styles.highlightItem}>
								<View style={styles.highlightDot} />
								<Text style={styles.highlightText}>Expert in classroom mentoring and exam preparation.</Text>
							</View>
							<View style={styles.highlightItem}>
								<View style={styles.highlightDot} />
								<Text style={styles.highlightText}>Supports lesson planning, assessments, and parent communication.</Text>
							</View>
							<View style={styles.highlightItem}>
								<View style={styles.highlightDot} />
								<Text style={styles.highlightText}>Focused on student engagement, feedback, and academic growth.</Text>
							</View>
						</View>
					</View>
				</View>
			</View>

			<Modal visible={editing} animationType="slide" transparent>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<View style={styles.modalHeader}>
							<View>
								<Text style={styles.modalTitle}>Edit Profile</Text>
								<Text style={styles.modalSubtitle}>Update the teacher details and save to reflect changes on the profile page.</Text>
							</View>
							<TouchableOpacity onPress={handleDiscard} style={styles.modalCloseButton} activeOpacity={0.8}>
								<Text style={styles.modalCloseText}>✕</Text>
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Full Name</FieldLabel>
									<ProfileInput value={draft?.fullName || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, fullName: text }))} editable placeholder="Enter full name" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Qualification</FieldLabel>
									<ProfileInput value={draft?.qualification || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, qualification: text }))} editable placeholder="Enter qualification" />
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Profile Photo URL</FieldLabel>
									<ProfileInput
										value={draft?.photoUri || ""}
										onChangeText={(text) => setDraft((prev) => ({ ...prev, photoUri: text }))}
										editable
										placeholder="Paste image URL or use upload"
									/>
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Photo Upload</FieldLabel>
									<TouchableOpacity style={styles.secondaryButton} onPress={handlePickPhoto} activeOpacity={0.85}>
										<Text style={styles.secondaryButtonText}>Upload Photo</Text>
									</TouchableOpacity>
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Age</FieldLabel>
									<ProfileInput value={draft?.age || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, age: text }))} editable placeholder="Enter age" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Experience</FieldLabel>
									<ProfileInput value={draft?.experience || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, experience: text }))} editable placeholder="Enter experience" />
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Subject</FieldLabel>
									<ProfileInput value={draft?.subject || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, subject: text }))} editable placeholder="Enter subject" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Employee ID</FieldLabel>
									<ProfileInput value={draft?.employeeId || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, employeeId: text }))} editable placeholder="Enter employee id" />
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Email Address</FieldLabel>
									<ProfileInput value={draft?.email || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, email: text }))} editable placeholder="Enter email address" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Phone Number</FieldLabel>
									<ProfileInput value={draft?.phone || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, phone: text }))} editable placeholder="Enter phone number" />
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Department</FieldLabel>
									<ProfileInput value={draft?.department || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, department: text }))} editable placeholder="Enter department" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Joining Date</FieldLabel>
									<ProfileInput value={draft?.joiningDate || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, joiningDate: text }))} editable placeholder="Enter joining date" />
								</View>
							</View>

							<View style={[styles.fieldGrid, IS_MOBILE && styles.fieldGridStack]}>
								<View style={styles.fieldCol}>
									<FieldLabel>Class Assigned</FieldLabel>
									<ProfileInput value={draft?.classAssigned || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, classAssigned: text }))} editable placeholder="Enter assigned class" />
								</View>
								<View style={styles.fieldCol}>
									<FieldLabel>Campus</FieldLabel>
									<ProfileInput value={draft?.location || ""} onChangeText={(text) => setDraft((prev) => ({ ...prev, location: text }))} editable placeholder="Enter campus" />
								</View>
							</View>

							<View style={styles.bioBlock}>
								<FieldLabel>Professional Bio</FieldLabel>
								<ProfileInput
									value={draft?.bio || ""}
									onChangeText={(text) => setDraft((prev) => ({ ...prev, bio: text }))}
									editable
									multiline
									placeholder="Write a short teaching summary"
								/>
							</View>
						</ScrollView>

						<View style={styles.actionRow}>
							<TouchableOpacity style={styles.secondaryButton} onPress={handleDiscard} activeOpacity={0.85}>
								<Text style={styles.secondaryButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.85}>
								<Text style={styles.primaryButtonText}>Save Changes</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: T.pageBg,
	},
	pageContent: {
		padding: IS_MOBILE ? 16 : 28,
		paddingBottom: 36,
	},
	backdropTop: {
		position: "absolute",
		top: -80,
		right: -120,
		width: 260,
		height: 260,
		borderRadius: 130,
		backgroundColor: "rgba(240, 217, 168, 0.35)",
	},
	backdropBottom: {
		position: "absolute",
		bottom: 60,
		left: -90,
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: "rgba(36, 76, 115, 0.10)",
	},
	headerCard: {
		backgroundColor: T.cardBg,
		borderRadius: 24,
		padding: IS_MOBILE ? 18 : 24,
		borderWidth: 1,
		borderColor: T.cardBorder,
		shadowColor: T.shadow,
		shadowOffset: { width: 0, height: 14 },
		shadowOpacity: 1,
		shadowRadius: 28,
		elevation: 3,
		marginBottom: 18,
	},
	headerRow: {
		flexDirection: IS_MOBILE ? "column" : "row",
		alignItems: IS_MOBILE ? "flex-start" : "center",
		gap: 16,
	},
	avatarWrap: {
		width: 104,
		height: 104,
		borderRadius: 28,
		padding: 6,
		backgroundColor: T.goldLight,
		alignItems: "center",
		justifyContent: "center",
	},
	avatar: {
		width: 92,
		height: 92,
		borderRadius: 46,
		backgroundColor: T.blue,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarImage: {
		width: "100%",
		height: "100%",
	},
	avatarText: {
		fontSize: 28,
		fontWeight: "800",
		color: T.white,
		letterSpacing: 1,
	},
	avatarUploadText: {
		marginTop: 8,
		fontSize: 11,
		fontWeight: "700",
		color: T.blue,
	},
	headerTextBlock: {
		flex: 1,
	},
	pageTitle: {
		fontSize: IS_MOBILE ? 28 : 36,
		fontWeight: "800",
		color: T.ink,
		marginBottom: 6,
		letterSpacing: -0.4,
		...Platform.select({
			ios: { fontFamily: "Georgia" },
			android: { fontFamily: "serif" },
			web: { fontFamily: "Georgia, serif" },
		}),
	},
	pageSubtitle: {
		color: T.subtext,
		fontSize: 14,
		lineHeight: 22,
		maxWidth: 640,
	},
	fetchHint: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "600",
		color: T.blue,
	},
	fetchError: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "600",
		color: "#b91c1c",
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginTop: 14,
	},
	badge: {
		backgroundColor: T.goldLight,
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 999,
	},
	badgeSoft: {
		backgroundColor: T.blueLight,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "800",
		color: T.goldDark,
		letterSpacing: 0.8,
	},
	badgeTextSoft: {
		color: T.blue,
	},
	editButton: {
		alignSelf: IS_MOBILE ? "stretch" : "flex-start",
		backgroundColor: T.blue,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	editButtonText: {
		color: T.white,
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
	},
	statRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 18,
	},
	statRowStack: {
		flexDirection: "column",
	},
	statCard: {
		flex: 1,
		backgroundColor: T.goldLight,
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(192, 138, 42, 0.18)",
	},
	statCardBlue: {
		backgroundColor: T.blueLight,
		borderColor: "rgba(36, 76, 115, 0.14)",
	},
	statCardGreen: {
		backgroundColor: T.greenLight,
		borderColor: "rgba(47, 133, 90, 0.16)",
	},
	statValue: {
		fontSize: 19,
		fontWeight: "800",
		color: T.goldDark,
		marginBottom: 4,
	},
	statValueBlue: {
		color: T.blue,
	},
	statValueGreen: {
		color: T.green,
	},
	statLabel: {
		fontSize: 12,
		color: T.subtext,
		fontWeight: "600",
	},
	contentGrid: {
		flexDirection: "row",
		gap: 18,
	},
	contentGridStack: {
		flexDirection: "column",
	},
	leftColumn: {
		width: IS_MOBILE ? "100%" : 320,
		gap: 18,
	},
	rightColumn: {
		flex: 1,
	},
	card: {
		backgroundColor: T.cardBg,
		borderRadius: 22,
		padding: 20,
		borderWidth: 1,
		borderColor: T.cardBorder,
		shadowColor: T.shadow,
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 1,
		shadowRadius: 24,
		elevation: 2,
	},
	cardGap: {
		marginTop: 18,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: T.ink,
		marginBottom: 14,
	},
	cardSubtitle: {
		marginTop: 4,
		color: T.subtext,
		fontSize: 13,
	},
	infoRow: {
		paddingVertical: 11,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(234, 223, 206, 0.8)",
		gap: 4,
	},
	infoLabel: {
		fontSize: 11,
		letterSpacing: 0.7,
		fontWeight: "700",
		color: T.muted,
		textTransform: "uppercase",
	},
	infoValue: {
		fontSize: 14,
		color: T.ink,
		fontWeight: "600",
		lineHeight: 20,
	},
	sectionHeader: {
		marginBottom: 16,
	},
	infoCardGrid: {
		gap: 12,
	},
	infoChip: {
		backgroundColor: "#fcfaf6",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: T.cardBorder,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	infoChipLabel: {
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		color: T.muted,
		marginBottom: 4,
	},
	infoChipValue: {
		fontSize: 14,
		fontWeight: "600",
		color: T.ink,
	},
	fieldGrid: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 14,
	},
	fieldGridStack: {
		flexDirection: "column",
	},
	fieldCol: {
		flex: 1,
	},
	fieldLabel: {
		fontSize: 11,
		fontWeight: "800",
		color: T.muted,
		letterSpacing: 0.8,
		marginBottom: 7,
		textTransform: "uppercase",
	},
	input: {
		minHeight: 48,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: T.cardBorder,
		backgroundColor: T.white,
		color: T.ink,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 14,
		...Platform.select({
			web: { outlineStyle: "none" },
		}),
	},
	inputReadOnly: {
		color: T.ink,
		backgroundColor: "#fcfaf6",
	},
	textArea: {
		minHeight: 110,
		textAlignVertical: "top",
	},
	bioBlock: {
		marginTop: 2,
	},
	actionRow: {
		flexDirection: IS_MOBILE ? "column" : "row",
		justifyContent: "flex-end",
		gap: 12,
		marginTop: 18,
	},
	secondaryButton: {
		borderRadius: 14,
		borderWidth: 1,
		borderColor: T.cardBorder,
		backgroundColor: T.white,
		paddingHorizontal: 18,
		paddingVertical: 13,
	},
	secondaryButtonText: {
		color: T.subtext,
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
	primaryButton: {
		borderRadius: 14,
		backgroundColor: T.gold,
		paddingHorizontal: 18,
		paddingVertical: 13,
	},
	primaryButtonText: {
		color: T.white,
		fontSize: 14,
		fontWeight: "800",
		textAlign: "center",
	},
	highlightList: {
		gap: 12,
	},
	highlightItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	highlightDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: T.gold,
		marginTop: 5,
	},
	highlightText: {
		flex: 1,
		color: T.subtext,
		fontSize: 14,
		lineHeight: 21,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(17, 24, 39, 0.55)",
		justifyContent: "center",
		padding: 16,
	},
	modalCard: {
		backgroundColor: T.cardBg,
		borderRadius: 24,
		padding: 18,
		maxHeight: "92%",
		borderWidth: 1,
		borderColor: T.cardBorder,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
		marginBottom: 14,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: T.ink,
		marginBottom: 4,
	},
	modalSubtitle: {
		fontSize: 13,
		lineHeight: 20,
		color: T.subtext,
		maxWidth: 520,
	},
	modalCloseButton: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f1ece2",
	},
	modalCloseText: {
		fontSize: 16,
		color: T.ink,
		fontWeight: "700",
	},
	modalContent: {
		paddingBottom: 8,
	},
});
