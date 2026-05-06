import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Addstudent({
	studentOptions = [],
	selectedIds = [],
	onToggle,
	loading = false,
	emptyText = 'No students found',
}) {
	const selectedSet = new Set((selectedIds || []).map((id) => String(id)));

	if (loading) {
		return (
			<View style={styles.centerState}>
				<Text style={styles.stateText}>Loading students...</Text>
			</View>
		);
	}

	if (!studentOptions.length) {
		return (
			<View style={styles.centerState}>
				<Text style={styles.stateText}>{emptyText}</Text>
			</View>
		);
	}

	return (
		<FlatList
			data={studentOptions}
			keyExtractor={(item) => String(item.id)}
			showsVerticalScrollIndicator={false}
			renderItem={({ item }) => {
				const normalizedId = String(item.id);
				const isSelected = selectedSet.has(normalizedId);

				return (
					<TouchableOpacity
						style={[styles.row, isSelected && styles.rowSelected]}
						activeOpacity={0.75}
						onPress={() => onToggle && onToggle(normalizedId)}
					>
						<Text style={[styles.name, isSelected && styles.nameSelected]}>{item.name}</Text>
						<View style={[styles.symbol, isSelected && styles.symbolSelected]}>
							{isSelected ? <Text style={styles.check}>✓</Text> : null}
						</View>
					</TouchableOpacity>
				);
			}}
		/>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		backgroundColor: '#F9FAFB',
	},
	rowSelected: {
		borderColor: '#1E3A5F',
		backgroundColor: '#EFF6FF',
	},
	name: {
		flex: 1,
		color: '#111827',
		fontSize: 14,
		fontWeight: '600',
	},
	nameSelected: {
		color: '#1D4ED8',
	},
	symbol: {
		width: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#D1D5DB',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10,
	},
	symbolSelected: {
		borderColor: '#1E3A5F',
		backgroundColor: '#1E3A5F',
	},
	check: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	centerState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
	},
	stateText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6B7280',
	},
});
